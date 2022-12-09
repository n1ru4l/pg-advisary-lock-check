import { createPool, sql } from "slonik";

const pool = await createPool(
  "postgres://postgres:postgres@localhost:5432/postgres"
);

try {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const lock = (id: number) => sql`select pg_advisory_lock(${id})`;
  const unlock = (id: number) => sql`select pg_advisory_unlock(${id})`;

  if (process.env.VARIANT === "a") {
    // THIS is the first process that should be started
    // It will lock 2 and then wait for 5 seconds then unlock id

    await pool.connect(async (conn) => {
      console.log("a lock 2");
      await Promise.all([conn.query(lock(2))]);
      await sleep(10_000);
      await conn.query(unlock(2));
      console.log("a unlock 2");
    });
  }

  if (process.env.VARIANT === "b") {
    // THIS is the second process that should be started
    // It will first try to lock 2 (which should already be locked)
    // Then afterwards try to lock 1

    // As lock 2 is already blocked the promise should not resolve until lock 2 is unlocked in process a
    // If postgres can handle only one active statement per connection that means lock 1 will not be acuqired be locked until 2 is unlocked

    // but the behavior we want is that b1 is locked before b2 is unlocked

    await pool.connect(async (conn) => {
      await Promise.all([
        conn.query(lock(2)).then(() => {
          console.log("b 2 is unlocked");
        }),
        // we delay lock allocation of 1 to make sure that 2 is already locked
        // and demonstarte that the lock(2) is blocking lock(1)
        sleep(100)
          .then(() => conn.query(lock(1)))
          .then(() => {
            console.log("b 1 is unlocked");
          }),
      ]);
      await conn.query(unlock(2));
      await conn.query(unlock(1));
    });
  }
} finally {
  pool.end();
}
