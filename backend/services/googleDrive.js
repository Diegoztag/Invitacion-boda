const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.auth = null;
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        this.connected = false;
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize auth using service account
            const keyFile = path.join(__dirname, '../credentials/google-service-account.json');
            this.auth = new google.auth.GoogleAuth({
                keyFile: keyFile,
                scopes: ['https://www.googleapis.com/auth/drive.file']
            });

            this.drive = google.drive({ version: 'v3', auth: this.auth });
            
            // Create folder if it doesn't exist
            await this.createFolderIfNotExists();
            this.connected = true;
        } catch (error) {
            console.error('Error initializing Google Drive:', error);
            this.connected = false;
        }
    }

    async createFolderIfNotExists() {
        try {
            if (!this.folderId) {
                // Create a new folder
                const folderMetadata = {
                    name: 'Fotos Boda - ' + new Date().getFullYear(),
                    mimeType: 'application/vnd.google-apps.folder'
                };

                const folder = await this.drive.files.create({
                    resource: folderMetadata,
                    fields: 'id'
                });

                this.folderId = folder.data.id;
                console.log('Created new folder with ID:', this.folderId);
                
                // Make folder publicly accessible
                await this.setFolderPermissions(this.folderId);
            } else {
                // Check if folder exists
                try {
                    await this.drive.files.get({
                        fileId: this.folderId,
                        fields: 'id, name'
                    });
                } catch (error) {
                    if (error.code === 404) {
                        console.log('Folder not found, creating new one...');
                        this.folderId = null;
                        await this.createFolderIfNotExists();
                    }
                }
            }
        } catch (error) {
            console.error('Error creating/checking folder:', error);
            throw error;
        }
    }

    async setFolderPermissions(folderId) {
        try {
            // Make folder viewable by anyone with the link
            await this.drive.permissions.create({
                fileId: folderId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });
        } catch (error) {
            console.error('Error setting folder permissions:', error);
        }
    }

    async uploadPhoto(filePath, fileName) {
        if (!this.connected) {
            throw new Error('Google Drive service not connected');
        }

        try {
            const fileMetadata = {
                name: fileName,
                parents: [this.folderId]
            };

            const media = {
                mimeType: this.getMimeType(fileName),
                body: fs.createReadStream(filePath)
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, webViewLink, webContentLink'
            });

            // Set file permissions
            await this.drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            return {
                fileId: response.data.id,
                webViewLink: response.data.webViewLink,
                webContentLink: response.data.webContentLink
            };
        } catch (error) {
            console.error('Error uploading photo:', error);
            throw error;
        }
    }

    async listPhotos() {
        if (!this.connected) {
            throw new Error('Google Drive service not connected');
        }

        try {
            const response = await this.drive.files.list({
                q: `'${this.folderId}' in parents and mimeType contains 'image/'`,
                fields: 'files(id, name, webViewLink, webContentLink, createdTime)',
                orderBy: 'createdTime desc',
                pageSize: 100
            });

            return response.data.files;
        } catch (error) {
            console.error('Error listing photos:', error);
            throw error;
        }
    }

    async deletePhoto(fileId) {
        if (!this.connected) {
            throw new Error('Google Drive service not connected');
        }

        try {
            await this.drive.files.delete({
                fileId: fileId
            });
            return true;
        } catch (error) {
            console.error('Error deleting photo:', error);
            throw error;
        }
    }

    async getPhotoUrl(fileId) {
        if (!this.connected) {
            throw new Error('Google Drive service not connected');
        }

        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'webContentLink'
            });

            return response.data.webContentLink;
        } catch (error) {
            console.error('Error getting photo URL:', error);
            throw error;
        }
    }

    getMimeType(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    isConnected() {
        return this.connected;
    }

    getFolderLink() {
        if (this.folderId) {
            return `https://drive.google.com/drive/folders/${this.folderId}`;
        }
        return null;
    }
}

module.exports = new GoogleDriveService();
