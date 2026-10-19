import ftplib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock
from scripts.deploy import public_files, upload


class DeployTests(unittest.TestCase):
    def test_only_public_assets_and_homepage_last(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ('css', 'images', 'js', 'pages'):
                (root / name).mkdir()
            for name in ('index.html', 'README.md', 'css/site.css', 'js/main.js',
                         'pages/.env', 'pages/secret.py', 'pages/about.html'):
                (root / name).write_text('test')
            self.assertEqual([p.as_posix() for p in public_files(root)],
                             ['css/site.css', 'js/main.js', 'pages/about.html', 'index.html'])

    def test_wrong_root_stops_before_upload(self):
        ftp = Mock()
        ftp.cwd.side_effect = [None, ftplib.error_perm('550')]
        with self.assertRaises(ftplib.error_perm):
            upload(ftp, Path('.'), [])
        ftp.storbinary.assert_not_called()
        ftp.mkd.assert_not_called()

    def test_only_contact_php_is_published(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ('css', 'images', 'js', 'pages'):
                (root / name).mkdir()
            for name in ('index.html', 'pages/contact-send.php', 'pages/secret.php'):
                (root / name).write_text('test')
            self.assertEqual(public_files(root), [Path('pages/contact-send.php'), Path('index.html')])
            ftp = Mock()
            upload(ftp, root, [Path('pages/contact-send.php')])
            ftp.rename.assert_called_once_with('.contact-send.deploy-tmp.php', 'contact-send.php')

    def test_failed_transfer_does_not_replace_original(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'index.html').write_text('test')
            ftp = Mock()
            ftp.storbinary.side_effect = OSError('connection lost')
            with self.assertRaises(OSError):
                upload(ftp, root, [Path('index.html')])
            ftp.rename.assert_not_called()
            ftp.delete.assert_not_called()

    def test_success_renames_complete_file_without_deletes(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'index.html').write_text('test')
            ftp = Mock()
            upload(ftp, root, [Path('index.html')])
            ftp.rename.assert_called_once_with('.index.html.deploy-tmp', 'index.html')
            ftp.delete.assert_not_called()


if __name__ == '__main__':
    unittest.main()
