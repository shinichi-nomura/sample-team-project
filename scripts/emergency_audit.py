"""Read-only FTPS audit for the temporarily locked production website.

Reports only counts and comparisons, never server file contents or secrets.
"""

import ftplib
import hashlib
import os
from pathlib import Path
import ssl


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_PHP = {
    "pages/contact-send.php",
    "pages/cms-feed.php",
    "pages/site-security.php",
    "pages/site-config.php",  # generated on the server; do not download
}
COMPARE_PHP = EXPECTED_PHP - {"pages/site-config.php"}
OTHER_EXECUTABLE_SUFFIXES = (".phtml", ".phar", ".cgi", ".pl", ".sh")
LOCK_MARKER = b"# BEGIN TOKIMEKI EMERGENCY LOCKDOWN 2026-10-21\n"


def retrieve(ftp, path):
    chunks = []
    parent, _, name = path.rpartition("/")
    ftp.cwd("/" + parent if parent else "/")
    ftp.retrbinary("RETR " + name, chunks.append)
    return b"".join(chunks)


def list_files(ftp):
    pending = ["/"]
    files = set()
    directories = set()
    while pending:
        directory = pending.pop()
        if directory in directories:
            continue
        directories.add(directory)
        if len(directories) > 1000:
            raise RuntimeError("Directory scan limit exceeded")
        ftp.cwd(directory)
        for name, facts in ftp.mlsd():
            if name in (".", "..") or "/" in name or "\\" in name:
                continue
            path = directory.rstrip("/") + "/" + name
            kind = facts.get("type", "")
            if kind == "dir":
                pending.append(path)
            elif kind == "file":
                files.add(path.lstrip("/"))
            if len(files) > 10000:
                raise RuntimeError("File scan limit exceeded")
    return files


def main():
    credentials = [os.environ.get(key, "") for key in
                   ("FTP_SERVER", "FTP_USERNAME", "FTP_PASSWORD")]
    if not all(credentials) or any("\r" in value or "\n" in value for value in credentials):
        raise ValueError("Missing or invalid FTPS credentials")
    host, username, password = credentials
    with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=60) as ftp:
        ftp.connect(host, 21)
        ftp.login(username, password)
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.cwd("/")
        for name in ("css", "images", "js", "pages"):
            ftp.cwd("/" + name)
        ftp.cwd("/")

        files = list_files(ftp)
        php = {name for name in files if name.lower().endswith(".php")}
        extra_php = php - EXPECTED_PHP
        other_executables = {name for name in files if name.lower().endswith(OTHER_EXECUTABLE_SUFFIXES)}
        lock_present = ".htaccess" in files and retrieve(ftp, ".htaccess").startswith(LOCK_MARKER)
        checks = {}
        for name in sorted(COMPARE_PHP):
            if name not in files:
                checks[name] = "missing"
                continue
            checks[name] = ("matches repository" if
                            hashlib.sha256(retrieve(ftp, name)).digest() ==
                            hashlib.sha256((ROOT / name).read_bytes()).digest()
                            else "differs from repository")

    print("Emergency access block: " + ("present" if lock_present else "not confirmed"))
    print("PHP file count: " + str(len(php)))
    print("Unexpected PHP file count: " + str(len(extra_php)))
    print("Other executable-extension file count: " + str(len(other_executables)))
    for name, result in checks.items():
        print(name + ": " + result)
    if (not lock_present or extra_php or other_executables or
            any(result != "matches repository" for result in checks.values())):
        raise RuntimeError("Potentially unexpected executable content; keep site locked")


if __name__ == "__main__":
    main()
