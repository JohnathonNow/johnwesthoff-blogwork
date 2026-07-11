import imaplib
import email
import os
import argparse
from email.header import decode_header

def clean_filename(filename):
    """Clean the filename to remove invalid characters."""
    return "".join(c if c.isalnum() or c in " ._-()" else "_" for c in filename)

def connect_imap(username, password):
    """Connect to Gmail IMAP server and login."""
    print("Connecting to Gmail IMAP server...")
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(username, password)
    return imap

def download_images(imap, folder_name, output_dir):
    """Download image attachments from a specific folder."""
    # Select the folder
    status, messages = imap.select(f'"{folder_name}"')
    if status != "OK":
        print(f"Error: Could not select folder {folder_name}.")
        return

    # Search for unread emails in the folder
    status, messages = imap.search(None, "UNSEEN")
    if status != "OK":
        print("Error: Could not search emails.")
        return

    email_ids = messages[0].split()
    print(f"Found {len(email_ids)} unread emails in {folder_name}.")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for e_id in email_ids:
        # Fetch the email message by ID without setting \Seen flag
        status, msg_data = imap.fetch(e_id, "(BODY.PEEK[])")
        if status != "OK":
            continue

        has_downloaded_images = False

        for response_part in msg_data:
            if isinstance(response_part, tuple):
                # Parse a bytes email into a message object
                msg = email.message_from_bytes(response_part[1])

                # Subject for logging/naming if needed
                subject_parts = decode_header(msg["Subject"]) if msg["Subject"] else []
                subject_decoded_parts = []
                for p, enc in subject_parts:
                    if isinstance(p, bytes):
                        try:
                            subject_decoded_parts.append(p.decode(enc if enc else "utf-8"))
                        except Exception:
                            subject_decoded_parts.append("Unknown_Subject")
                    else:
                        subject_decoded_parts.append(str(p))
                subject = "".join(subject_decoded_parts) if subject_decoded_parts else "Unknown_Subject"

                # If the email message is multipart
                if msg.is_multipart():
                    # Iterate over the email parts
                    for part in msg.walk():
                        # Extract content type of email
                        content_type = part.get_content_type()
                        content_disposition = str(part.get("Content-Disposition"))

                        if "attachment" in content_disposition or part.get_filename():
                            # Check if the attachment is an image
                            if content_type.startswith("image/"):
                                filename = part.get_filename()
                                if filename:
                                    # decode filename if needed
                                    filename_parts = decode_header(filename)
                                    decoded_filename_parts = []
                                    for p, enc in filename_parts:
                                        if isinstance(p, bytes):
                                            try:
                                                decoded_filename_parts.append(p.decode(enc if enc else "utf-8"))
                                            except Exception:
                                                decoded_filename_parts.append("image_attachment")
                                        else:
                                            decoded_filename_parts.append(str(p))
                                    decoded_filename = "".join(decoded_filename_parts)

                                    filename = clean_filename(decoded_filename)
                                    filepath = os.path.join(output_dir, filename)

                                    # Handle duplicate filenames
                                    base, ext = os.path.splitext(filepath)
                                    counter = 1
                                    while os.path.exists(filepath):
                                        filepath = f"{base}_{counter}{ext}"
                                        counter += 1

                                    # Download attachment and save it
                                    with open(filepath, "wb") as f:
                                        f.write(part.get_payload(decode=True))
                                    print(f"Downloaded: {filepath}")
                                    has_downloaded_images = True

        if has_downloaded_images:
            # Mark the email as read
            imap.store(e_id, '+FLAGS', '\\Seen')
            print(f"Marked email {e_id.decode()} as read.")

def main():
    parser = argparse.ArgumentParser(description="Download image attachments from Gmail.")
    parser.add_argument("-u", "--username", required=True, help="Gmail email address")
    parser.add_argument("-p", "--password", required=True, help="Gmail App Password")
    parser.add_argument("-f", "--folder", required=True, help="Gmail folder name (e.g., INBOX, 'Photos')")
    parser.add_argument("-o", "--output", default="attachments", help="Output directory for downloaded images")

    args = parser.parse_args()

    try:
        imap = connect_imap(args.username, args.password)
        download_images(imap, args.folder, args.output)
        imap.close()
        imap.logout()
        print("Done!")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
