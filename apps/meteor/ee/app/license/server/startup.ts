import { License } from '@rocket.chat/license';
import { LivechatVisitors, Subscriptions, Users } from '@rocket.chat/models';
import moment from 'moment';

import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { getAppCount } from './lib/getAppCount';

settings.watch<string>('Site_Url', (value) => {
	if (value) {
		void License.setWorkspaceUrl(value);
	}
});

callbacks.add('workspaceLicenseChanged', async (updatedLicense) => {
	try {
		await License.setLicense(updatedLicense);
	} catch (_error) {
		// Ignore
	}
});

const getCurrentPeriod = () => {
	moment.utc().format('YYYY-MM');
};

License.setLicenseLimitCounter('activeUsers', () => Users.getActiveLocalUserCount());
License.setLicenseLimitCounter('guestUsers', () => Users.getActiveLocalGuestCount());
License.setLicenseLimitCounter('roomsPerGuest', async (context) => (context?.userId ? Subscriptions.countByUserId(context.userId) : 0));
License.setLicenseLimitCounter('privateApps', () => getAppCount('private'));
License.setLicenseLimitCounter('marketplaceApps', () => getAppCount('marketplace'));
// #TODO: Get real value
License.setLicenseLimitCounter('monthlyActiveContacts', async () => LivechatVisitors.countVisitorsOnPeriod(getCurrentPeriod()));
