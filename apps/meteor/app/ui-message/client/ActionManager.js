import { UIKitIncomingInteractionType } from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitInteractionTypes } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';
import { lazy } from 'react';

import * as banners from '../../../client/lib/banners';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { router } from '../../../client/providers/RouterProvider';
import { sdk } from '../../utils/client/lib/SDKClient';
import { t } from '../../utils/lib/i18n';

const UiKitModal = lazy(() => import('../../../client/views/modal/uikit/UiKitModal'));

/** @typedef {Exclude<import('react').ContextType<typeof import('@rocket.chat/ui-contexts').ActionManagerContext>, undefined>} ActionManager */

export const events = new Emitter();

/** @type {ActionManager['on']} */
export const on = (viewId, listener) => {
	events.on(viewId, listener);
};

/** @type {ActionManager['off']} */
export const off = (viewId, listener) => {
	events.off(viewId, listener);
};

const TRIGGER_TIMEOUT = 5000;

const TRIGGER_TIMEOUT_ERROR = 'TRIGGER_TIMEOUT_ERROR';

const triggersId = new Map();

/** @type {Map<string, { close: () => void }>} */
const instances = new Map();

const invalidateTriggerId = (id) => {
	const appId = triggersId.get(id);
	triggersId.delete(id);
	return appId;
};

export const generateTriggerId = (appId) => {
	const triggerId = Random.id();
	triggersId.set(triggerId, appId);
	setTimeout(invalidateTriggerId, TRIGGER_TIMEOUT, triggerId);
	return triggerId;
};

/** @type {ActionManager['handlePayloadUserInteraction']} */
export const handlePayloadUserInteraction = (type, { /* appId,*/ triggerId, ...data }) => {
	if (!triggersId.has(triggerId)) {
		return;
	}
	const appId = invalidateTriggerId(triggerId);
	if (!appId) {
		return;
	}

	const { view } = data;
	let { viewId } = data;

	if (view && view.id) {
		viewId = view.id;
	}

	if (!viewId) {
		return;
	}

	if ([UIKitInteractionTypes.ERRORS].includes(type)) {
		events.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data,
		});
		return UIKitInteractionTypes.ERRORS;
	}

	if ([UIKitInteractionTypes.BANNER_UPDATE, UIKitInteractionTypes.CONTEXTUAL_BAR_UPDATE].includes(type)) {
		events.emit(viewId, {
			type,
			triggerId,
			viewId,
			appId,
			...data,
		});
		return type;
	}

	if (type === UIKitInteractionTypes.MODAL_OPEN) {
		const instance = imperativeModal.open({
			component: UiKitModal,
			props: {
				key: data.view.id,
				initialView: {
					viewId: data.view.id,
					appId: data.view.appId,
					blocks: data.view.blocks,
					title: data.view.title,
					close: data.view.close,
					showIcon: data.view.showIcon,
					submit: data.view.submit,
				},
			},
		});

		instances.set(viewId, {
			close() {
				instance.close();
				instances.delete(viewId);
			},
		});

		return type;
	}

	if (type === UIKitInteractionTypes.MODAL_UPDATE) {
		events.emit(viewId, {
			type,
			triggerId,
			viewId: data.view.id,
			appId: data.view.appId,
			blocks: data.view.blocks,
			title: data.view.title,
			close: data.view.close,
			showIcon: data.view.showIcon,
			submit: data.view.submit,
		});

		return type;
	}

	if ([UIKitInteractionTypes.CONTEXTUAL_BAR_OPEN].includes(type)) {
		instances.set(viewId, {
			payload: {
				type,
				triggerId,
				appId,
				viewId,
				...data,
			},
			close() {
				instances.delete(viewId);
			},
		});

		router.navigate({
			name: router.getRouteName(),
			params: {
				...router.getRouteParameters(),
				tab: 'app',
				context: viewId,
			},
		});

		return UIKitInteractionTypes.CONTEXTUAL_BAR_OPEN;
	}

	if (type === UIKitInteractionTypes.BANNER_OPEN) {
		banners.open(data);
		instances.set(viewId, {
			close() {
				banners.closeById(viewId);
			},
		});

		return UIKitInteractionTypes.BANNER_OPEN;
	}

	if ([UIKitIncomingInteractionType.BANNER_CLOSE].includes(type)) {
		const instance = instances.get(viewId);

		if (instance) {
			instance.close();
		}
		return UIKitIncomingInteractionType.BANNER_CLOSE;
	}

	if ([UIKitIncomingInteractionType.CONTEXTUAL_BAR_CLOSE].includes(type)) {
		const instance = instances.get(viewId);

		if (instance) {
			instance.close();
		}
		return UIKitIncomingInteractionType.CONTEXTUAL_BAR_CLOSE;
	}

	return UIKitInteractionTypes.MODAL_ClOSE;
};

/** @type {ActionManager['triggerAction']} */
export const triggerAction = async ({ type, actionId, appId, rid, mid, viewId, container, tmid, ...rest }) =>
	new Promise(async (resolve, reject) => {
		events.emit('busy', { busy: true });

		const triggerId = generateTriggerId(appId);

		const payload = rest.payload || rest;

		setTimeout(reject, TRIGGER_TIMEOUT, [TRIGGER_TIMEOUT_ERROR, { triggerId, appId }]);

		const { type: interactionType, ...data } = await (async () => {
			try {
				return await sdk.rest.post(`/apps/ui.interaction/${appId}`, {
					type,
					actionId,
					payload,
					container,
					mid,
					rid,
					tmid,
					triggerId,
					viewId,
				});
			} catch (e) {
				reject(e);
				return {};
			} finally {
				events.emit('busy', { busy: false });
			}
		})();

		return resolve(handlePayloadUserInteraction(interactionType, data));
	});

/** @type {ActionManager['triggerBlockAction']} */
export const triggerBlockAction = (options) => triggerAction({ type: UIKitIncomingInteractionType.BLOCK, ...options });

/** @type {ActionManager['triggerActionButtonAction']} */
export const triggerActionButtonAction = (options) =>
	triggerAction({ type: UIKitIncomingInteractionType.ACTION_BUTTON, ...options }).catch(async (reason) => {
		if (Array.isArray(reason) && reason[0] === TRIGGER_TIMEOUT_ERROR) {
			dispatchToastMessage({
				type: 'error',
				message: t('UIKit_Interaction_Timeout'),
			});
		}
	});

/** @type {ActionManager['triggerSubmitView']} */
export const triggerSubmitView = async ({ viewId, ...options }) => {
	const close = () => {
		const instance = instances.get(viewId);

		if (instance) {
			instance.close();
		}
	};

	try {
		const result = await triggerAction({
			type: UIKitIncomingInteractionType.VIEW_SUBMIT,
			viewId,
			...options,
		});
		if (!result || UIKitInteractionTypes.MODAL_CLOSE === result) {
			close();
		}
	} catch {
		close();
	}
};

/** @type {ActionManager['triggerCancel']} */
export const triggerCancel = async ({ view, ...options }) => {
	const instance = instances.get(view.id);
	try {
		await triggerAction({ type: UIKitIncomingInteractionType.VIEW_CLOSED, view, ...options });
	} finally {
		if (instance) {
			instance.close();
		}
	}
};

/** @type {ActionManager['getUserInteractionPayloadByViewId']} */
export const getUserInteractionPayloadByViewId = (viewId) => {
	if (!viewId) {
		throw new Error('No viewId provided when checking for `user interaction payload`');
	}

	const instance = instances.get(viewId);

	if (!instance) {
		return {};
	}

	return instance.payload;
};
