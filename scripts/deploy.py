import os
import sys
import paramiko
import stat

HOST = os.environ.get('DREAMHOST_HOST', 'iad1-shared-b7-01.dreamhost.com')
USER = os.environ.get('DREAMHOST_USER', 'dh_cpxtem')
PASSWORD = os.environ.get('DREAMHOST_PASS', "\"e#e6SjLxQA:'7*")
REMOTE_DIR = os.environ.get('DREAMHOST_DIR', '/home/dh_cpxtem/cormorant.aredpanic.com')
LOCAL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist'))

def sftp_upload_dir(sftp, local_dir, remote_dir):
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        print(f"Creating remote directory: {remote_dir}")
        sftp.mkdir(remote_dir)
        sftp.chmod(remote_dir, 0o755)

    entries = os.listdir(local_dir)
    for entry in entries:
        local_path = os.path.join(local_dir, entry)
        remote_path = f"{remote_dir}/{entry}"

        if os.path.isdir(local_path):
            sftp_upload_dir(sftp, local_path, remote_path)
        else:
            local_size = os.path.getsize(local_path)
            print(f"Uploading: {entry} ({local_size} bytes) -> {remote_path}")
            sftp.put(local_path, remote_path)
            sftp.chmod(remote_path, 0o644)

def main():
    print(f"Connecting to {HOST} as {USER}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=20)
    print("SSH connection established.")

    stdin, stdout, stderr = client.exec_command(f"ls -la {REMOTE_DIR}")
    print("\nCurrent contents of remote web root:")
    print(stdout.read().decode())

    print(f"\nStarting SFTP upload from local: {LOCAL_DIR}")
    sftp = client.open_sftp()
    sftp_upload_dir(sftp, LOCAL_DIR, REMOTE_DIR)
    sftp.close()

    print("\nUpload complete! Verifying remote directory contents:")
    stdin, stdout, stderr = client.exec_command(f"ls -la {REMOTE_DIR} && ls -la {REMOTE_DIR}/assets/images/backgrounds | head -10")
    print(stdout.read().decode())

    client.close()
    print("Deployment finished successfully!")

if __name__ == '__main__':
    main()
