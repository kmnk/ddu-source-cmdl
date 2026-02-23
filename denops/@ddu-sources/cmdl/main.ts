// ddu-source-cmdl - A ddu.vim source that lists user-registered Vim commands.
// Generated with Claude Code assistance.

import { BaseSource } from "@shougo/ddu-vim/source";
import type { GatherArguments } from "@shougo/ddu-vim/source";
import type { Item, ItemHighlight } from "@shougo/ddu-vim/types";
import type { Denops } from "@denops/std";

/** The file name used to persist command entries within the data directory. */
export const DATA_FILE_NAME = "cmdl.json";

/**
 * A single command entry stored in the data file.
 * `label` is the human-readable name shown in the ddu UI.
 * `command` is the Ex command executed when the entry is invoked.
 */
export type CmdlEntry = {
  label: string;
  command: string;
};

/**
 * Action data passed from the source to the cmdl kind.
 * Extends CmdlEntry with the resolved path to the data file so that
 * kind actions (add/edit/delete) know where to persist changes.
 *
 * When `isPlaceholder` is true the item is a display-only sentinel shown
 * when the entry list is empty. Kind actions must skip placeholder items.
 */
export type ActionData = CmdlEntry & {
  /** Absolute path to the JSON data file. */
  dataPath: string;
  /** True for the empty-state placeholder item. Not a real entry. */
  isPlaceholder?: boolean;
};

type Params = {
  highlights: {
    /** Highlight group applied to the command column. Default: "Comment". */
    command: string;
    /** Highlight group applied to the empty-state placeholder row. Default: "Comment". */
    placeholder: string;
  };
};

export class Source extends BaseSource<Params> {
  override kind = "cmdl";

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    const { highlights } = args.sourceParams;
    return new ReadableStream({
      async start(controller) {
        const dataPath = await resolveDataPath(args.denops);
        const entries = await loadEntries(dataPath);
        const enc = new TextEncoder();

        const items: Item<ActionData>[] = entries.map((entry) => {
          const display = `${entry.label}\t${entry.command}`;
          const labelByteLen = enc.encode(entry.label).length;
          const commandByteLen = enc.encode(entry.command).length;
          // command starts at: label bytes + 1 tab byte + 1-based offset
          const commandCol = labelByteLen + 2;

          const itemHighlights: ItemHighlight[] = [];
          if (highlights.command !== "") {
            itemHighlights.push({
              name: "ddu-source-cmdl-command",
              hl_group: highlights.command,
              col: commandCol,
              width: commandByteLen,
            });
          }

          return {
            word: entry.label,
            display,
            highlights: itemHighlights,
            action: {
              label: entry.label,
              command: entry.command,
              dataPath,
            },
          };
        });

        if (items.length === 0) {
          const placeholderText = "(No commands registered)";
          const itemHighlights: ItemHighlight[] = [];
          if (highlights.placeholder !== "") {
            itemHighlights.push({
              name: "ddu-source-cmdl-placeholder",
              hl_group: highlights.placeholder,
              col: 1,
              width: enc.encode(placeholderText).length,
            });
          }
          items.push({
            word: placeholderText,
            highlights: itemHighlights,
            action: {
              label: "",
              command: "",
              dataPath,
              isPlaceholder: true,
            },
          });
        }

        controller.enqueue(items);
        controller.close();
      },
    });
  }

  override params(): Params {
    return {
      highlights: {
        command: "Comment",
        placeholder: "Comment",
      },
    };
  }
}

/**
 * Resolves the absolute path to the data file by calling the Vim autoload
 * function `ddu_source_cmdl#get_data_directory_path()`.
 */
export async function resolveDataPath(denops: Denops): Promise<string> {
  const dir = await denops.call(
    "ddu_source_cmdl#get_data_directory_path",
  ) as string;
  return `${dir}/${DATA_FILE_NAME}`;
}

/**
 * Loads command entries from the JSON data file.
 * Returns an empty array if the file does not exist or cannot be parsed.
 */
export async function loadEntries(dataPath: string): Promise<CmdlEntry[]> {
  let text: string;
  try {
    text = await Deno.readTextFile(dataPath);
  } catch {
    return [];
  }
  try {
    const data: unknown = JSON.parse(text);
    if (!Array.isArray(data)) return [];
    return data.filter(isCmdlEntry);
  } catch {
    return [];
  }
}

/**
 * Saves command entries to the JSON data file.
 * Creates intermediate directories if they do not exist.
 */
export async function saveEntries(
  dataPath: string,
  entries: CmdlEntry[],
): Promise<void> {
  const dir = dataPath.slice(0, dataPath.lastIndexOf("/"));
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(
    dataPath,
    JSON.stringify(entries, null, 2) + "\n",
  );
}

function isCmdlEntry(v: unknown): v is CmdlEntry {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).label === "string" &&
    typeof (v as Record<string, unknown>).command === "string"
  );
}
