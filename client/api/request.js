import { POST, DELETE, failureReason } from '@vanilla-bean/components';

import Notify from '../shared/Notify';

// A refused request resolves (status 'error'), it does not throw: the server's reason goes to the player here
const announced = async request => {
	const result = await request;

	if (result.status === 'error') new Notify({ intent: 'danger', content: failureReason(result) });

	return result;
};

export const post = (...args) => announced(POST(...args));
export const del = (...args) => announced(DELETE(...args));
