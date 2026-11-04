import {
	ComponentType,
	ButtonStyle,
	type APIComponentInContainer,
	type APIContainerComponent,
	type APITextDisplayComponent,
	type APISectionComponent,
} from 'discord-api-types/v10';
import type { SensProfile } from '../db/query';
const SENS_TYPES = [
	{ type: 'Mouse & Keyboard', code: 'mkb', icon: '🖱️' },
	{ type: 'Controller', code: 'controller', icon: '🎮' },
] as const;
export function buildSensContainer(sensProfiles: SensProfile[], emptyMessage: string, editable: boolean): APIContainerComponent {
	// Set the header text
	const header: APITextDisplayComponent = {
		type: ComponentType.TextDisplay,
		content: `**Sens Profiles for ${sensProfiles[0].name}**`,
	};
	const components: APIComponentInContainer[] = [header];

	// Every row shares the character's slug (the global profile's is ALL_CHARACTERS.value), so it identifies the button target.
	const slug = sensProfiles[0].slug;

	// Build the TextDisplay components for each sens profile
	for (const sensType of SENS_TYPES) {
		const profile = sensProfiles.find((p) => p.type === sensType.type);
		let content: string;
		if (profile) {
			content = `**${sensType.icon} ${profile.type}**\nX-Axis: \`${profile.x_axis}\`\nY-Axis: \`${profile.y_axis}\`\n`;
			content += profile.dpi !== null ? `DPI: \`${profile.dpi}\`\n` : '';
			content += `-# Last Updated: ${profile.updated_at ? `<t:${profile.updated_at}:R>` : 'Unknown'}`;
		} else {
			content = `**${sensType.icon} ${sensType.type}**\nNo profile available.`;
		}
		const textDisplay: APITextDisplayComponent = {
			type: ComponentType.TextDisplay,
			content,
		};

		if (editable) {
			const section: APISectionComponent = {
				type: ComponentType.Section,
				components: [textDisplay],
				accessory: {
					type: ComponentType.Button,
					style: ButtonStyle.Secondary,
					label: profile ? `Edit` : `Set`,
					custom_id: `setsens:${slug}:${sensType.code}`,
				},
			};
			components.push(section);
		} else {
			components.push(textDisplay);
		}
	}

	return {
		type: ComponentType.Container,
		accent_color: 0xc90076,
		components,
	};
}
