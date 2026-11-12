import { EmptyState, GET, failureReason } from '@vanilla-bean/components';

/**
 * Fetches a doc for a pane: a loading EmptyState stands in while it comes, and a failed one, with Try again, if it
 * doesn't. Resolves once the doc is in, so a pane that's closed while it waits simply never fills.
 * @example appendTo(pane, await loadDoc(pane, 'docs/help.md', 'SpaceCo documentation'));
 * @param {object} container - Where the stand-ins go (an Elem or Component)
 * @param {string} url - The doc's url
 * @param {string} what - What the doc is, for the failed title
 * @returns {Promise<string>} The doc's body
 */
export const loadDoc = (container, url, what) =>
	new Promise(resolve => {
		const attempt = async (options = {}) => {
			const loading = new EmptyState({ loading: true, appendTo: container });
			const result = await GET(url, options);

			loading.destroy();

			if (result.response?.ok) return resolve(result.body);

			const failed = new EmptyState({
				appendTo: container,
				icon: 'triangle-exclamation',
				title: `Couldn't load the ${what}`,
				message: failureReason(result),
				action: {
					textContent: 'Try again',
					onPointerPress: () => {
						failed.destroy();
						attempt({ cache: false });
					},
				},
			});
		};

		attempt();
	});
