"""Temporarily deny web requests on the production Apache site via FTPS.

The existing .htaccess contents are preserved after an identifiable prefix so
the lockdown can be reversed without restoring a remote backup file.
"""

import ftplib
import io
import os
import ssl


MARKER = b"# BEGIN TOKIMEKI EMERGENCY LOCKDOWN 2026-10-21\n"
RULE = (
    MARKER
    + b"RewriteEngine On\n"
    + b"RewriteRule ^ - [F,L]\n"
    + b"# END TOKIMEKI EMERGENCY LOCKDOWN 2026-10-21\n"
)


def main():
    names = ("FTP_SERVER", "FTP_USERNAME", "FTP_PASSWORD")
    credentials = [os.environ.get(name, "") for name in names]
    if not all(credentials) or any("\n" in value or "\r" in value for value in credentials):
        raise ValueError("Missing or invalid FTPS credentials")

    host, username, password = credentials
    with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=60) as ftp:
        ftp.connect(host, 21)
        ftp.login(username, password)
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.cwd("/")
        # The configured account is jailed to the site's document root.
        for name in ("css", "images", "js", "pages"):
            ftp.cwd("/" + name)
        ftp.cwd("/")

        chunks = []
        try:
            ftp.retrbinary("RETR .htaccess", chunks.append)
        except ftplib.error_perm as error:
            if not str(error).startswith("550"):
                raise
        existing = b"".join(chunks)
        if existing.startswith(MARKER):
            print("Emergency lockdown already installed.")
            return

        ftp.storbinary("STOR .htaccess", io.BytesIO(RULE + existing))
        print("Emergency lockdown rules uploaded. Verify public HTTP responses.")


if __name__ == "__main__":
    main()
