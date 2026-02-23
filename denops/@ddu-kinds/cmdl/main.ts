// ddu-kind-cmdl - A ddu.vim kind for managing user-registered Vim commands.
// Generated with Claude Code assistance.

import { BaseKind } from "@shougo/ddu-vim/kind";
import { ActionFlags, type Actions } from "@shougo/ddu-vim/types";
import type { Denops } from "@denops/std";
import * as fn from "@denops/std/function";

import {
  type ActionData,
  DATA_FILE_NAME,
  loadEntries,
  saveEntries,
} from "../../@ddu-sources/cmdl/main.ts";

// Re-export ActionData so consumers can follow the standard pattern:
//   import type { ActionData } from "@kmnk/ddu-kind-cmdl";
export type { ActionData } from "../../@ddu-sources/cmdl/main.ts";

type Params = Record<string | number | symbol, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    /**
     * Execute the Vim command associated with the selected entry.
     * This is intended as the default action.
     */
    execute: {
      description: "Execute the registered Vim command.",
      callback: async (args) => {
        for (const item of args.items) {
          const action = item.action as ActionData;
          if (action.isPlaceholder) continue;
          await args.denops.cmd(action.command);
        }
        return ActionFlags.None;
      },
    },

    /**
     * Interactively add a new label+command entry to the data file.
     * Does not require an item to be selected.
     */
    add: {
      description: "Add a new command entry.",
      callback: async (args) => {
        const label = await fn.input(args.denops, "Label: ") as string;
        if (label === "") return ActionFlags.Persist;

        const command = await fn.input(args.denops, "Command: ") as string;
        if (command === "") return ActionFlags.Persist;

        const dataPath = await resolveDataPath(args.denops);
        const entries = await loadEntries(dataPath);
        entries.push({ label, command });
        await saveEntries(dataPath, entries);

        return ActionFlags.RefreshItems;
      },
    },

    /**
     * Edit the label and command of the first selected entry.
     * The current values are pre-filled in the input prompt.
     */
    edit: {
      description: "Edit the selected command entry.",
      callback: async (args) => {
        const item = args.items[0];
        if (!item) return ActionFlags.None;

        const action = item.action as ActionData;
        if (action.isPlaceholder) return ActionFlags.Persist;

        const newLabel = await fn.input(
          args.denops,
          "Label: ",
          action.label,
        ) as string;
        if (newLabel === "") return ActionFlags.Persist;

        const newCommand = await fn.input(
          args.denops,
          "Command: ",
          action.command,
        ) as string;
        if (newCommand === "") return ActionFlags.Persist;

        const entries = await loadEntries(action.dataPath);
        const idx = entries.findIndex(
          (e) => e.label === action.label && e.command === action.command,
        );
        if (idx !== -1) {
          entries[idx] = { label: newLabel, command: newCommand };
          await saveEntries(action.dataPath, entries);
        }

        return ActionFlags.RefreshItems;
      },
    },

    /**
     * Delete the selected entries after user confirmation.
     * Supports multi-item deletion.
     */
    delete: {
      description: "Delete the selected command entries.",
      callback: async (args) => {
        const realItems = args.items.filter(
          (item) => !(item.action as ActionData).isPlaceholder,
        );
        if (realItems.length === 0) return ActionFlags.Persist;

        const confirm = await fn.confirm(
          args.denops,
          `Delete ${realItems.length} entry(ies)?`,
          "&Yes\n&No",
          2,
        ) as number;
        if (confirm !== 1) return ActionFlags.Persist;

        // Group items by dataPath to minimize file I/O.
        const byPath = new Map<string, Set<string>>();
        for (const item of realItems) {
          const action = item.action as ActionData;
          const key = `${action.label}\0${action.command}`;
          const set = byPath.get(action.dataPath) ?? new Set<string>();
          set.add(key);
          byPath.set(action.dataPath, set);
        }

        for (const [dataPath, keys] of byPath) {
          const entries = await loadEntries(dataPath);
          const filtered = entries.filter(
            (e) => !keys.has(`${e.label}\0${e.command}`),
          );
          await saveEntries(dataPath, filtered);
        }

        return ActionFlags.RefreshItems;
      },
    },
  };

  override params(): Params {
    return {};
  }
}

/**
 * Resolves the absolute path to the data file by calling the Vim autoload
 * function `ddu_source_cmdl#get_data_directory_path()`.
 */
async function resolveDataPath(denops: Denops): Promise<string> {
  const dir = await denops.call(
    "ddu_source_cmdl#get_data_directory_path",
  ) as string;
  return `${dir}/${DATA_FILE_NAME}`;
}
