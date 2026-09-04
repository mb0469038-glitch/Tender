import {
  LogLevel,
  Univer,
  type IUniverConfig,
  type Plugin,
  type PluginCtor,
} from '@univerjs/core';
import { FUniver } from '@univerjs/core/facade';

type PluginRegistration = PluginCtor<Plugin> | [PluginCtor<Plugin>, unknown];
type FreePreset = { plugins: PluginRegistration[] };

interface FreeUniverConfig extends IUniverConfig {
  presets: FreePreset[];
  plugins?: PluginRegistration[];
}

/**
 * Registers only the explicitly supplied presets. This intentionally replaces the
 * umbrella @univerjs/presets helper, whose dependency graph also installs Pro presets.
 */
export function createFreeUniver({ presets, plugins = [], ...config }: FreeUniverConfig) {
  const univer = new Univer({ logLevel: LogLevel.WARN, ...config });
  const registrations = new Map<string, { plugin: PluginCtor<Plugin>; options?: unknown }>();

  for (const preset of presets) {
    for (const registration of preset.plugins) {
      const [plugin, options] = Array.isArray(registration)
        ? registration
        : [registration, undefined];
      registrations.delete(plugin.pluginName);
      registrations.set(plugin.pluginName, { plugin, options });
    }
  }

  for (const registration of plugins) {
    const [plugin, options] = Array.isArray(registration)
      ? registration
      : [registration, undefined];
    registrations.delete(plugin.pluginName);
    registrations.set(plugin.pluginName, { plugin, options });
  }

  for (const { plugin, options } of registrations.values()) {
    univer.registerPlugin(plugin, options as never);
  }

  return { univer, univerAPI: FUniver.newAPI(univer) };
}
