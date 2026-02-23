# ddu-source-cmdl

A [ddu.vim](https://github.com/Shougo/ddu.vim) source and kind for managing a
personal list of labeled Vim commands.

Each entry pairs a human-readable label with a Vim Ex command. Entries are
persisted to a local JSON file and can be registered, edited, deleted, and
executed through the ddu.vim interface.

## Requirements

- [denops.vim](https://github.com/vim-denops/denops.vim)
- [ddu.vim](https://github.com/Shougo/ddu.vim)
- A ddu UI plugin such as [ddu-ui-ff](https://github.com/Shougo/ddu-ui-ff)

## Installation

**vim-plug**

```vim
Plug 'kmnk/ddu-source-cmdl'
```

**lazy.nvim**

```lua
{
  'kmnk/ddu-source-cmdl',
  dependencies = {
    'Shougo/ddu.vim',
    'vim-denops/denops.vim',
  },
}
```

## Usage

### Quick start

```vim
call ddu#start(#{
\   ui: 'ff',
\   sources: [#{name: 'cmdl'}],
\   kindOptions: #{
\     cmdl: #{defaultAction: 'execute'},
\   },
\ })
```

### Keymaps (ddu-ui-ff)

```vim
" inside your ddu-ui-ff keymap block
call ddu#ui#ff#execute('itemAction', #{name: 'execute'})  " <CR> — run command
call ddu#ui#ff#execute('itemAction', #{name: 'add'})      " a    — add entry
call ddu#ui#ff#execute('itemAction', #{name: 'edit'})     " e    — edit entry
call ddu#ui#ff#execute('itemAction', #{name: 'delete'})   " d    — delete entry
```

### Data directory

Entries are stored in `~/.cache/ddu-source-cmdl/cmdl.json` by default.
Use `ddu_source_cmdl#set_data_directory_path()` to change the location:

```vim
call ddu_source_cmdl#set_data_directory_path('~/.local/share/cmdl')
```

## Source

Name: `cmdl`

### Source params

| Param | Type | Default | Description |
|---|---|---|---|
| `highlights.command` | `string` | `"Comment"` | Highlight group for the command column. Set to `""` to disable. |
| `highlights.placeholder` | `string` | `"Comment"` | Highlight group for the empty-state row. Set to `""` to disable. |

Example — custom command highlight:

```vim
call ddu#start(#{
\   sources: [#{
\     name: 'cmdl',
\     params: #{highlights: #{command: 'Statement'}},
\   }],
\ })
```

## Kind

Name: `cmdl`

### Actions

| Action | Description |
|---|---|
| `execute` | Execute the registered Ex command. Iterates over all selected items. |
| `add` | Prompt for a label and a command, then append a new entry. The selected item is ignored. |
| `edit` | Prompt to update the label and command of the first selected entry. Current values are pre-filled. |
| `delete` | Ask for confirmation and delete all selected entries. Supports multi-item deletion. |

## Data format

Entries are stored as a JSON array. Each element has two string fields:

```json
[
  {
    "label": "Open vimrc",
    "command": "edit $MYVIMRC"
  },
  {
    "label": "Source vimrc",
    "command": "source $MYVIMRC"
  }
]
```

The file is created automatically on the first `add` action.

## License

MIT — see [LICENSE](LICENSE)

---

Generated with [Claude Code](https://claude.com/claude-code) assistance.
