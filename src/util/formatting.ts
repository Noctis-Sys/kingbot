import { ComponentType, type APIContainerComponent, type APITextDisplayComponent } from 'discord-api-types/v10';
import type { SensProfile } from '../db/query';

export function buildSensContainer(sensProfiles: SensProfile[], emptyMessage: string): APIContainerComponent {
	let components: APITextDisplayComponent[];

	// A character with no sens rows comes back as one row whose type (and every other sens field) is null.
	if (sensProfiles[0]?.type == null) {
		components = [{ type: ComponentType.TextDisplay, content: emptyMessage }];
	} else {
		components = sensProfiles.map((profile) => {
			const icon = profile.type === 'Mouse & Keyboard' ? '🖱️' : '🎮';
			const dpi = profile.dpi !== null ? ` @ ${profile.dpi} DPI` : '';
			const lastUpdated = profile.updated_at ? `<t:${profile.updated_at}:R>` : 'Unknown';
			return {
				type: ComponentType.TextDisplay,
				content: `${icon} **${profile.type}**: ${profile.x_axis} & ${profile.y_axis}${dpi}\n-# Last updated: ${lastUpdated}`,
			};
		});
	}

	return {
		type: ComponentType.Container,
		accent_color: 0xc90076,
		components,
	};
}
