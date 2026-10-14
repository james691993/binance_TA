#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  print 'Không tìm thấy Python 3 trên máy này.'
  read '?Bấm Enter để đóng…'
  exit 1
fi
python3 launcher.py
result=$?
if (( result != 0 )); then
  read '?Không mở được ứng dụng. Bấm Enter để đóng…'
fi
exit $result
