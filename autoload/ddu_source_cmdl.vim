" autoload/ddu_source_cmdl.vim - Configuration helpers for ddu-source-cmdl.
" Generated with Claude Code assistance.

let s:data_dir = '~/.cache/ddu-source-cmdl'

" ddu_source_cmdl#set_data_directory_path({path})
"   Set the directory used to store the command list data file.
"   {path} may contain '~' which is expanded at access time.
"
"   Example:
"     call ddu_source_cmdl#set_data_directory_path('~/.local/share/cmdl')
function! ddu_source_cmdl#set_data_directory_path(path) abort
  let s:data_dir = a:path
endfunction

" ddu_source_cmdl#get_data_directory_path()
"   Return the absolute path to the data directory.
"   Called internally by the Denops source/kind to locate the data file.
function! ddu_source_cmdl#get_data_directory_path() abort
  return expand(s:data_dir)
endfunction
