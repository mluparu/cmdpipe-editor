/**
 * Cross-platform path utilities for task picker automation
 * 
 * This module provides utilities for handling file paths, directory scanning,
 * and cross-platform path operations using VS Code's file system APIs.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger';

/**
 * Path utility class for cross-platform file operations
 */
export class PathUtils {

    /**
     * Get the user configuration directory path
     * @returns User config path or null if not available
     */
    public static getUserConfigPath(logger: Logger): string | null {
        try {
            // Try to get VS Code user data directory
            const userDataPath = process.env.APPDATA || 
                                process.env.HOME || 
                                process.env.USERPROFILE;
            
            if (!userDataPath) {
                return null;
            }

            // Create cmdpipe-specific config path
            return path.join(userDataPath, '.vscode', 'cmdpipe', 'tasks');
        } catch (error) {
            logger.warn('Failed to determine user config path:', error);
            return null;
        }
    }
    
    // /**
    //  * Get the absolute path to the user's global task configuration directory
    //  * Uses VS Code's globalStorageUri for cross-platform compatibility
    //  */
    // public static async getUserConfigDirectory(): Promise<string> {
    //     // Use VS Code's global storage path for user configuration
    //     const globalStorageUri = vscode.workspace.getConfiguration('shellTaskPipe').get<string>('userConfigPath');
        
    //     if (globalStorageUri) {
    //         return globalStorageUri;
    //     }

    //     // Fallback to OS-specific user directories
    //     const homeDir = process.env.HOME || process.env.USERPROFILE;
    //     if (!homeDir) {
    //         throw new Error('Cannot determine user home directory');
    //     }

    //     return path.join(homeDir, '.vscode', 'shell-tasks');
    // }

    // /**
    //  * Get workspace-specific task configuration directory (.vscode folder)
    //  */
    // public static getWorkspaceConfigDirectory(): string | undefined {
    //     const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    //     if (!workspaceFolder) {
    //         return undefined;
    //     }

    //     return path.join(workspaceFolder.uri.fsPath, '.vscode');
    // }

    // /**
    //  * Get all potential task configuration file paths
    //  * Returns both workspace and user configuration paths
    //  */
    // public static async getAllConfigPaths(): Promise<string[]> {
    //     const paths: string[] = [];

    //     // Add workspace config path if available
    //     const workspaceConfigDir = this.getWorkspaceConfigDirectory();
    //     if (workspaceConfigDir) {
    //         paths.push(path.join(workspaceConfigDir, 'shell-tasks.json'));
    //         paths.push(path.join(workspaceConfigDir, 'tasks.json')); // VS Code tasks.json
    //     }

    //     // Add user config path
    //     try {
    //         const userConfigDir = await this.getUserConfigDirectory();
    //         paths.push(path.join(userConfigDir, 'shell-tasks.json'));
    //     } catch (error) {
    //         // Ignore user config if unavailable
    //     }

    //     return paths;
    // }

    // /**
    //  * Normalize path for consistent comparison across platforms
    //  */
    // public static normalizePath(filePath: string): string {
    //     return path.resolve(path.normalize(filePath));
    // }

    // /**
    //  * Check if a path is within the workspace
    //  */
    // public static isWorkspacePath(filePath: string): boolean {
    //     const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    //     if (!workspaceFolder) {
    //         return false;
    //     }

    //     const normalizedPath = this.normalizePath(filePath);
    //     const normalizedWorkspace = this.normalizePath(workspaceFolder.uri.fsPath);
        
    //     return normalizedPath.startsWith(normalizedWorkspace);
    // }

    // /**
    //  * Check if a path is a user configuration path
    //  */
    // public static async isUserConfigPath(filePath: string): Promise<boolean> {
    //     try {
    //         const userConfigDir = await this.getUserConfigDirectory();
    //         const normalizedPath = this.normalizePath(filePath);
    //         const normalizedUserDir = this.normalizePath(userConfigDir);
            
    //         return normalizedPath.startsWith(normalizedUserDir);
    //     } catch {
    //         return false;
    //     }
    // }

    // /**
    //  * Get relative path from workspace root for display purposes
    //  */
    // public static getWorkspaceRelativePath(filePath: string): string {
    //     const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    //     if (!workspaceFolder) {
    //         return filePath;
    //     }

    //     const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
        
    //     // If path is outside workspace, return absolute path
    //     if (relativePath.startsWith('..')) {
    //         return filePath;
    //     }

    //     return relativePath;
    // }

    // /**
    //  * Ensure directory exists using VS Code file system API
    //  */
    // public static async ensureDirectoryExists(dirPath: string): Promise<void> {
    //     const uri = vscode.Uri.file(dirPath);
        
    //     try {
    //         await vscode.workspace.fs.stat(uri);
    //     } catch (error) {
    //         // Directory doesn't exist, create it
    //         await vscode.workspace.fs.createDirectory(uri);
    //     }
    // }

    // /**
    //  * Check if file exists using VS Code file system API
    //  */
    // public static async fileExists(filePath: string): Promise<boolean> {
    //     const uri = vscode.Uri.file(filePath);
        
    //     try {
    //         const stat = await vscode.workspace.fs.stat(uri);
    //         return stat.type === vscode.FileType.File;
    //     } catch {
    //         return false;
    //     }
    // }

    // /**
    //  * Check if directory exists using VS Code file system API
    //  */
    // public static async directoryExists(dirPath: string): Promise<boolean> {
    //     const uri = vscode.Uri.file(dirPath);
        
    //     try {
    //         const stat = await vscode.workspace.fs.stat(uri);
    //         return stat.type === vscode.FileType.Directory;
    //     } catch {
    //         return false;
    //     }
    // }

    // /**
    //  * Get file modification time
    //  */
    // public static async getFileModificationTime(filePath: string): Promise<Date> {
    //     const uri = vscode.Uri.file(filePath);
        
    //     try {
    //         const stat = await vscode.workspace.fs.stat(uri);
    //         return new Date(stat.mtime);
    //     } catch (error) {
    //         throw new Error(`Cannot get modification time for ${filePath}: ${error}`);
    //     }
    // }

    // /**
    //  * Read file contents as string using VS Code file system API
    //  */
    // public static async readFileAsString(filePath: string): Promise<string> {
    //     const uri = vscode.Uri.file(filePath);
        
    //     try {
    //         const data = await vscode.workspace.fs.readFile(uri);
    //         return data.toString();
    //     } catch (error) {
    //         throw new Error(`Cannot read file ${filePath}: ${error}`);
    //     }
    // }

    // /**
    //  * Write string content to file using VS Code file system API
    //  */
    // public static async writeStringToFile(filePath: string, content: string): Promise<void> {
    //     const uri = vscode.Uri.file(filePath);
        
    //     try {
    //         const data = Buffer.from(content, 'utf8');
    //         await vscode.workspace.fs.writeFile(uri, data);
    //     } catch (error) {
    //         throw new Error(`Cannot write to file ${filePath}: ${error}`);
    //     }
    // }

    // /**
    //  * List files in directory with optional extension filter
    //  */
    // public static async listFiles(dirPath: string, extensions?: string[]): Promise<string[]> {
    //     const uri = vscode.Uri.file(dirPath);
        
    //     try {
    //         const entries = await vscode.workspace.fs.readDirectory(uri);
    //         const files: string[] = [];
            
    //         for (const [name, type] of entries) {
    //             if (type === vscode.FileType.File) {
    //                 if (!extensions || extensions.some(ext => name.endsWith(ext))) {
    //                     files.push(path.join(dirPath, name));
    //                 }
    //             }
    //         }
            
    //         return files;
    //     } catch (error) {
    //         throw new Error(`Cannot list files in ${dirPath}: ${error}`);
    //     }
    // }

    // /**
    //  * Generate content hash for change detection
    //  */
    // public static generateContentHash(content: string): string {
    //     // Simple hash function for content comparison
    //     let hash = 0;
    //     for (let i = 0; i < content.length; i++) {
    //         const char = content.charCodeAt(i);
    //         hash = ((hash << 5) - hash) + char;
    //         hash = hash & hash; // Convert to 32-bit integer
    //     }
    //     return hash.toString(36);
    // }

    // /**
    //  * Convert file path to URI string for VS Code APIs
    //  */
    // public static pathToUri(filePath: string): vscode.Uri {
    //     return vscode.Uri.file(this.normalizePath(filePath));
    // }

    // /**
    //  * Convert URI to normalized file path
    //  */
    // public static uriToPath(uri: vscode.Uri): string {
    //     return this.normalizePath(uri.fsPath);
    // }

    // /**
    //  * Get display name for a file path (filename without extension)
    //  */
    // public static getDisplayName(filePath: string): string {
    //     const basename = path.basename(filePath);
    //     const extname = path.extname(basename);
    //     return extname ? basename.slice(0, -extname.length) : basename;
    // }

    // /**
    //  * Get system temporary directory
    //  */
    // public static getTempDirectory(): string {
    //     return os.tmpdir();
    // }

    // /**
    //  * Generate unique temporary file path
    //  */
    // public static generateTempFilePath(prefix: string = 'cmdpipe', extension: string = '.tmp'): string {
    //     const tempDir = this.getTempDirectory();
    //     const filename = `${prefix}-${uuidv4()}${extension}`;
    //     return path.join(tempDir, filename);
    // }

    // /**
    //  * Create temporary file with content
    //  */
    // public static async createTempFile(content: Buffer | string, prefix: string = 'cmdpipe', extension: string = '.tmp'): Promise<string> {
    //     const tempFilePath = this.generateTempFilePath(prefix, extension);
        
    //     try {
    //         await fs.promises.writeFile(tempFilePath, content);
    //         return tempFilePath;
    //     } catch (error) {
    //         throw new Error(`Failed to create temporary file: ${error instanceof Error ? error.message : String(error)}`);
    //     }
    // }

    // /**
    //  * Delete temporary file safely
    //  */
    // public static async deleteTempFile(filePath: string): Promise<boolean> {
    //     try {
    //         // Verify the file is in temp directory for safety
    //         const tempDir = this.getTempDirectory();
    //         const normalizedPath = this.normalizePath(filePath);
    //         const normalizedTempDir = this.normalizePath(tempDir);
            
    //         if (!normalizedPath.startsWith(normalizedTempDir)) {
    //             throw new Error(`File ${filePath} is not in temporary directory`);
    //         }

    //         await fs.promises.unlink(filePath);
    //         return true;
    //     } catch (error) {
    //         // Log error but don't throw - temp files can be cleaned up by OS
    //         console.warn(`Failed to delete temporary file ${filePath}: ${error}`);
    //         return false;
    //     }
    // }

    // /**
    //  * Clean up old temporary files with specific prefix
    //  */
    // public static async cleanupTempFiles(prefix: string = 'cmdpipe', maxAgeHours: number = 24): Promise<number> {
    //     const tempDir = this.getTempDirectory();
    //     let cleanedCount = 0;
        
    //     try {
    //         const files = await fs.promises.readdir(tempDir);
    //         const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
            
    //         for (const file of files) {
    //             if (file.startsWith(prefix)) {
    //                 const filePath = path.join(tempDir, file);
    //                 try {
    //                     const stats = await fs.promises.stat(filePath);
    //                     if (stats.mtime.getTime() < cutoffTime) {
    //                         await fs.promises.unlink(filePath);
    //                         cleanedCount++;
    //                     }
    //                 } catch (error) {
    //                     // File may have been deleted already, continue
    //                     continue;
    //                 }
    //             }
    //         }
    //     } catch (error) {
    //         console.warn(`Failed to cleanup temp files: ${error}`);
    //     }
        
    //     return cleanedCount;
    // }
}

/**
 * Convenient path utility functions
 */
export const pathUtils = {
    getUserConfigPath: (logger: Logger) => PathUtils.getUserConfigPath(logger),
//     // getWorkspaceConfigDirectory: () => PathUtils.getWorkspaceConfigDirectory(),
//     // getAllConfigPaths: () => PathUtils.getAllConfigPaths(),
//     // normalizePath: (filePath: string) => PathUtils.normalizePath(filePath),
//     // isWorkspacePath: (filePath: string) => PathUtils.isWorkspacePath(filePath),
//     // isUserConfigPath: (filePath: string) => PathUtils.isUserConfigPath(filePath),
//     // getWorkspaceRelativePath: (filePath: string) => PathUtils.getWorkspaceRelativePath(filePath),
//     // ensureDirectoryExists: (dirPath: string) => PathUtils.ensureDirectoryExists(dirPath),
//     // fileExists: (filePath: string) => PathUtils.fileExists(filePath),
//     // directoryExists: (dirPath: string) => PathUtils.directoryExists(dirPath),
//     // getFileModificationTime: (filePath: string) => PathUtils.getFileModificationTime(filePath),
//     // readFileAsString: (filePath: string) => PathUtils.readFileAsString(filePath),
//     // writeStringToFile: (filePath: string, content: string) => PathUtils.writeStringToFile(filePath, content),
//     // listFiles: (dirPath: string, extensions?: string[]) => PathUtils.listFiles(dirPath, extensions),
//     // generateContentHash: (content: string) => PathUtils.generateContentHash(content),
//     // pathToUri: (filePath: string) => PathUtils.pathToUri(filePath),
//     // uriToPath: (uri: vscode.Uri) => PathUtils.uriToPath(uri),
//     // getDisplayName: (filePath: string) => PathUtils.getDisplayName(filePath)
};
