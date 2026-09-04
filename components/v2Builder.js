'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

function buildPanel({ accentColor, blocks }) {
  const container = new ContainerBuilder();
  if (accentColor !== undefined) container.setAccentColor(accentColor);

  for (const block of blocks) {
    if (block.type === 'text') {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(block.content));
    } else if (block.type === 'separator') {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(block.large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small)
      );
    } else if (block.type === 'actionRow') {
      container.addActionRowComponents(block.row);
    }
  }
  return container;
}

function panelPayload(container, { ephemeral = true } = {}) {
  const flags = MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0);
  return { components: [container], flags };
}

module.exports = { buildPanel, panelPayload };
