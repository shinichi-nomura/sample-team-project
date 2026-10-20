"""Upload the static website to the FTP account's configured public directory."""
import base64
import io
import json
import ftplib
import os
from pathlib import Path
import ssl
import sys

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PHP = {Path('pages/contact-send.php'), Path('pages/cms-feed.php'), Path('pages/site-security.php')}
ROOT_FILES = (Path('index.html'), Path('robots.txt'), Path('sitemap.xml'))

PUBLIC_DIRS = ('css', 'images', 'js', 'pages')
EXTENSIONS = {'.html', '.css', '.js', '.json', '.webp', '.png', '.jpg', '.jpeg',
              '.gif', '.svg', '.ico', '.avif', '.woff', '.woff2', '.ttf', '.otf',
              '.mp4', '.webm', '.pdf'}


def public_files(root):
    paths = [root / name for name in ROOT_FILES]
    for name in PUBLIC_DIRS:
        directory = root / name
        if not directory.is_dir() or directory.is_symlink():
            raise ValueError('Missing or unsafe public directory')
        paths.extend(directory.rglob('*'))
    result = []
    for path in paths:
        relative = path.relative_to(root)
        if path.is_symlink():
            raise ValueError('Symbolic links cannot be published')
        if any(part.startswith('.') for part in relative.parts):
            continue
        if path.is_file() and (path.suffix.lower() in EXTENSIONS or relative in PUBLIC_PHP or relative in ROOT_FILES):
            if any(c in relative.as_posix() for c in '\r\n'):
                raise ValueError('Unsafe filename')
            result.append(relative)
    if any(name not in result for name in ROOT_FILES):
        raise ValueError('Missing required public root file')
    # Assets first, HTML last, homepage last of all.
    return sorted(result, key=lambda p: (p == Path('index.html'), p.suffix == '.html', p.as_posix()))


def upload(ftp, root, paths, config=None):
    # This account is jailed to public_html/mizu-tokimeki.com; do not repeat that path.
    ftp.cwd('/')
    for name in PUBLIC_DIRS:
        ftp.cwd('/' + name)  # Fail before writing if this is not the existing site's root.
    ftp.cwd('/')
    if config is not None:
        ftp.cwd('/pages')
        ftp.storbinary('STOR .site-config.deploy-tmp.php', io.BytesIO(config))
        ftp.rename('.site-config.deploy-tmp.php', 'site-config.php')
    for relative in paths:
        ftp.cwd('/')
        for part in relative.parent.parts:
            try:
                ftp.cwd(part)
            except ftplib.error_perm:
                ftp.mkd(part)
                ftp.cwd(part)
        # Complete the upload before replacing the publicly visible file.
        temporary = ('.' + relative.stem + '.deploy-tmp.php' if relative in PUBLIC_PHP
                     else '.' + relative.name + '.deploy-tmp')
        with (root / relative).open('rb') as source:
            ftp.storbinary('STOR ' + temporary, source, blocksize=262144)
        ftp.rename(temporary, relative.name)
    # No remote deletes: preserve error/, .htaccess, and server-only configuration.


def private_config(environ):
    fields = {'cms_key': 'CMS_API_KEY', 'turnstile_site': 'TURNSTILE_SITE_KEY',
              'turnstile_secret': 'TURNSTILE_SECRET_KEY'}
    config = {}
    for field, name in fields.items():
        value = environ.get(name, '')
        if not value or len(value) > 1024 or any(c.isspace() or ord(c) < 32 for c in value):
            raise ValueError('Missing or invalid site security secrets')
        if field.startswith('turnstile') and value.startswith(('1x000000', '2x000000', '3x000000')):
            raise ValueError('Turnstile testing keys must not be deployed')
        config[field] = value
    # Base64 is serialization, not encryption. This PHP file must only execute on the server.
    payload = base64.b64encode(json.dumps(config).encode()).decode('ascii')
    return ("<?php\ndeclare(strict_types=1);\n"
            "if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) { http_response_code(404); exit; }\n"
            "return json_decode(base64_decode('" + payload + "'), true, 512, JSON_THROW_ON_ERROR);\n").encode()


def main():
    config = private_config(os.environ)  # Validate before connecting or uploading.
    paths = public_files(ROOT)
    credentials = [os.environ.get(key, '') for key in
                   ('FTP_SERVER', 'FTP_USERNAME', 'FTP_PASSWORD')]
    if not all(credentials) or any('\r' in v or '\n' in v for v in credentials):
        raise ValueError('Missing or invalid FTP secrets')
    host, username, password = credentials
    with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=60) as ftp:
        ftp.connect(host, 21)
        ftp.login(username, password)  # Explicit TLS; never fall back to plain FTP.
        ftp.prot_p()  # Encrypt file data as well as credentials.
        ftp.set_pasv(True)
        upload(ftp, ROOT, paths, config)
    print(f'Upload completed: {len(paths)} files.')
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as stream:
            stream.write(f'Published {len(paths)} files. No remote files deleted.\n\n'
                         'Check https://mizu-tokimeki.com/ in a browser.\n')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Do not echo server responses or secrets into public workflow logs.
        print(f'Deployment failed ({type(error).__name__}). Check FTP secrets, TLS, '
              'site security secrets, and that the account root contains css/images/js/pages. '
              'Some files may already have been updated; rerun after resolving the issue.',
              file=sys.stderr)
        sys.exit(1)
