import { APIEmbed } from 'discord-api-types/v10';
import { SensProfile } from '../db/query';

export function buildSensEmbed(sensProfiles: SensProfile[], emptyMessage: string): APIEmbed {
	let embedContent = '';
	// Checking type but the other sens fields are null when no sens profile

	if (sensProfiles[0].type === null) {
		embedContent = emptyMessage;
	} else {
		for (const profile of sensProfiles) {
			embedContent += profile.type === 'Mouse & Keyboard' ? '🖱️ ' : '🎮 ';
			embedContent += `**${profile.type}**: ${profile.x_axis} & ${profile.y_axis}`;
			if (profile.dpi !== null) {
				embedContent += ` @ ${profile.dpi} DPI`;
			}
			embedContent += '\n';
			embedContent += `-# Last updated: `;
			embedContent += profile.updated_at ? `<t:${profile.updated_at}:R>` : 'Unknown';
			embedContent += '\n\n';
		}
	}

	let sensEmbed = {
		color: 0x00ff00,
		title: `Sens for ${sensProfiles[0].name}`,
		description: embedContent.trim(),
	};
	return sensEmbed;
}
