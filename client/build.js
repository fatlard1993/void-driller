import { buildClient } from '@vanilla-bean/components/app';

const { success } = await buildClient();

if (!success) process.exit(1);
