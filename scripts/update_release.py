import sys
import hashlib
import json
from pathlib import Path


def update_appcast(version, desc):
    release_file = Path(f'release/openai-translator-{version}.bobplugin')
    assert release_file.is_file(), 'Release file not exist'
    with open(release_file, 'rb') as f:
        c = f.read()
        file_hash = hashlib.sha256(c).hexdigest()
    version_info = {
        'version': version,
        'desc': desc,
        'sha256': file_hash,
        'url': f'https://github.com/yetone/bob-plugin-openai-translator/releases/download/v{version}/{release_file.name}',
        'minBobVersion': '0.5.0'
    }
    appcast_file = Path('appcast.json')
    if appcast_file.is_file():
        with open(appcast_file, 'r') as f:
            appcast = json.load(f)
    else:
        appcast = dict(identifier='yetone.openai.translator', versions=[])
    appcast['versions'].insert(0, version_info)
    with open(appcast_file, 'w') as f:
        json.dump(appcast, f, ensure_ascii=False, indent=2)

def update_info_json(version):
    info_file = Path('src/info.json')
    with open(info_file, 'r') as f:
        info = json.load(f)
    info['version'] = version
    with open(info_file, 'w') as f:
        json.dump(info, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    version = sys.argv[1]
    desc = sys.argv[2]
    update_appcast(version, desc)
    update_info_json(version)