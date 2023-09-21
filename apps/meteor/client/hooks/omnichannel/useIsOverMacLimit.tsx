// @ts-nocheck
// import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useIsOverMacLimit = (): boolean => {
	const getMacLimit = () => Promise.resolve(false); // useEndpoint('GET', '/v1/livechat/mac'); // TODO: add the correct endpoint
	const { data: isOverMacLimit } = useQuery(['omnichannel', '/v1/livechat/mac'], () => getMacLimit());
	return isOverMacLimit;
};
