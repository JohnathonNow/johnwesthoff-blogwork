import unittest
from unittest.mock import MagicMock, patch
import os
import shutil
from email.message import Message
import gmail_image_downloader

class TestGmailImageDownloader(unittest.TestCase):

    def setUp(self):
        self.output_dir = "test_output_dir"
        if os.path.exists(self.output_dir):
            shutil.rmtree(self.output_dir)

    def tearDown(self):
        if os.path.exists(self.output_dir):
            shutil.rmtree(self.output_dir)

    @patch('gmail_image_downloader.imaplib.IMAP4_SSL')
    def test_connect_imap(self, mock_imap4):
        mock_imap = MagicMock()
        mock_imap4.return_value = mock_imap

        gmail_image_downloader.connect_imap("testuser@gmail.com", "testpassword")

        mock_imap4.assert_called_once_with("imap.gmail.com")
        mock_imap.login.assert_called_once_with("testuser@gmail.com", "testpassword")

    @patch('gmail_image_downloader.email.message_from_bytes')
    def test_download_images(self, mock_message_from_bytes):
        mock_imap = MagicMock()
        mock_imap.select.return_value = ("OK", [b""])
        mock_imap.search.return_value = ("OK", [b"1 2"])

        mock_imap.fetch.return_value = ("OK", [(b"1", b"fake_email_bytes")])

        # Create a mock email message with an attachment
        mock_msg = Message()
        mock_msg["Subject"] = "Test Subject"

        mock_part = MagicMock()
        mock_part.get_content_type.return_value = "image/jpeg"
        mock_part.get.return_value = "attachment; filename=test.jpg"
        mock_part.get_filename.return_value = "test.jpg"
        mock_part.get_payload.return_value = b"fake_image_data"

        mock_msg.is_multipart = MagicMock(return_value=True)
        mock_msg.walk = MagicMock(return_value=[mock_msg, mock_part])

        mock_message_from_bytes.return_value = mock_msg

        gmail_image_downloader.download_images(mock_imap, "INBOX", self.output_dir)

        # Verify that the image was downloaded
        self.assertTrue(os.path.exists(self.output_dir))
        self.assertTrue(os.path.exists(os.path.join(self.output_dir, "test.jpg")))
        with open(os.path.join(self.output_dir, "test.jpg"), "rb") as f:
            self.assertEqual(f.read(), b"fake_image_data")

    def test_clean_filename(self):
        self.assertEqual(gmail_image_downloader.clean_filename("test file!?.jpg"), "test file__.jpg")
        self.assertEqual(gmail_image_downloader.clean_filename("good_file-name.png"), "good_file-name.png")

if __name__ == '__main__':
    unittest.main()
