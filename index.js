import { createClient } from 'redis';
import Queue from 'bee-queue';
import Bottleneck from 'bottleneck';

const redis = createClient({
  database: 2,
});

const queue = new Queue('test', { redis });
const limiter = new Bottleneck({
  id: 'test',
  maxConcurrent: 2,
  datastore: 'redis',
  clientOptions: {
    database: 2,
  },
});

limiter.on('error', e => console.error(e));

let job = 0;

queue.process(1000, async () =>
  limiter.schedule(async () => {
    job += 1;
    const number = job;
    console.log(`starting job ${number}`);

    await new Promise(r => setTimeout(r, 100));

    if (number == 2) {
      console.log('setting concurrency to 3');
      limiter.updateSettings({ maxConcurrent: 3 });
    }
    if (number == 7) {
      console.log('setting concurrency to 2');
      limiter.updateSettings({ maxConcurrent: 2 });
    }
    if (number == 10) {
      console.log('setting concurrency to 1');
      limiter.updateSettings({ maxConcurrent: 1 });
    }

    console.log(`finishing job ${number}`);
  })
);

for (let i = 0; i < 20; i++) {
  queue.createJob().save();
}
