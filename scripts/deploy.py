"""Upload the static website to the FTP account's configured public directory."""
import ftplib
import os
from pathlib import Path
import ssl
import sys

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIRS = ('css', 'images', 'js', 'pages')
EXTENSIONS = {'.html', '.css', '.js', '.json', '.webp', '.png', '.jpg', '.jpeg',
              '.gif', '.svg', '.ico', '.avif', '.woff', '.woff2', '.ttf', '.otf',
              '.mp4', '.webm', '.pdf'}


def public_files(root):
    paths = [root / 'index.html']
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
        if path.is_file() and (path.suffix.lower() in EXTENSIONS or relative == Path('pages/contact-send.php')):
            if any(c in relative.as_posix() for c in '\r\n'):
                raise ValueError('Unsafe filename')
            result.append(relative)
    if Path('index.html') not in result:
        raise ValueError('Missing index.html')
    # Assets first, HTML last, homepage last of all.
    return sorted(result, key=lambda p: (p == Path('index.html'), p.suffix == '.html', p.as_posix()))


def upload(ftp, root, paths):
    # This account is jailed to public_html/mizu-tokimeki.com; do not repeat that path.
    ftp.cwd('/')
    for name in PUBLIC_DIRS:
        ftp.cwd('/' + name)  # Fail before writing if this is not the existing site's root.
    ftp.cwd('/')
    for relative in paths:
        ftp.cwd('/')
        for part in relative.parent.parts:
            try:
                ftp.cwd(part)
            except ftplib.error_perm:
                ftp.mkd(part)
                ftp.cwd(part)
        # Complete the upload before replacing the publicly visible file.
        temporary = ('.contact-send.deploy-tmp.php' if relative == Path('pages/contact-send.php')
                     else '.' + relative.name + '.deploy-tmp')
        with (root / relative).open('rb') as source:
            ftp.storbinary('STOR ' + temporary, source, blocksize=262144)
        ftp.rename(temporary, relative.name)
    # No remote deletes: preserve error/, .htaccess, and server-only configuration.


def main():
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
        upload(ftp, ROOT, paths)
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
              'and that the account root contains css/images/js/pages. '
              'Some files may already have been updated; rerun after resolving the issue.',
              file=sys.stderr)
        sys.exit(1)
