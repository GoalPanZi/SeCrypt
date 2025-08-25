const express = require('express');
const router = express.Router();
const { rateLimiters } = require('../config/rateLimiter');

console.log('📁 Loading file management routes...');

// TODO: 컨트롤러 import (나중에 생성 후 활성화)
// const {
//   uploadFile,
//   downloadFile,
//   getFileInfo,
//   deleteFile,
//   getUserFiles,
//   getChatFiles,
//   generateThumbnail,
//   getFilePreview,
//   shareFile,
//   getFileStats,
//   searchFiles,
//   getFileHistory,
//   updateFileInfo,
//   getStorageInfo
// } = require('../controllers/fileController');

// TODO: 미들웨어 import (나중에 생성 후 활성화)
// const { authenticateToken } = require('../middlewares/auth');
// const { upload } = require('../middlewares/upload');
// const { checkFilePermissions } = require('../middlewares/filePermissions');
// const { validateFileUpload } = require('../middlewares/validation');
// const { encryptFile, decryptFile } = require('../middlewares/encryption');

// 임시 응답 함수
const tempResponse = (action) => (req, res) => {
  res.status(501).json({
    message: `${action} endpoint not implemented yet`,
    note: 'Controller and middleware need to be created',
    receivedData: {
      body: req.body,
      params: req.params,
      query: req.query,
      files: req.files
    },
    timestamp: new Date().toISOString()
  });
};

// =============================================================================
// 파일 업로드
// =============================================================================

/**
 * @route POST /api/files/upload
 * @desc 파일 업로드
 * @access Private
 * @form files[] (multipart/form-data)
 * @body { chatId?, description? }
 */
router.post('/upload',
  rateLimiters.upload,
  // authenticateToken, // TODO: 나중에 활성화
  // upload.array('files', 10), // TODO: 나중에 활성화 (최대 10개 파일)
  // validateFileUpload, // TODO: 나중에 활성화
  // encryptFile, // TODO: 나중에 활성화
  tempResponse('Upload File')
  // uploadFile // TODO: 나중에 활성화
);

/**
 * @route POST /api/files/upload/avatar
 * @desc 아바타/프로필 이미지 업로드
 * @access Private
 * @form avatar (multipart/form-data)
 */
router.post('/upload/avatar',
  rateLimiters.upload,
  // authenticateToken, // TODO: 나중에 활성화
  // upload.single('avatar'), // TODO: 나중에 활성화
  // validateFileUpload, // TODO: 나중에 활성화
  tempResponse('Upload Avatar')
);

/**
 * @route POST /api/files/upload/chat-avatar
 * @desc 채팅방 아바타 업로드
 * @access Private
 * @form chatAvatar (multipart/form-data)
 * @body { chatId }
 */
router.post('/upload/chat-avatar',
  rateLimiters.upload,
  // authenticateToken, // TODO: 나중에 활성화
  // upload.single('chatAvatar'), // TODO: 나중에 활성화
  // validateFileUpload, // TODO: 나중에 활성화
  tempResponse('Upload Chat Avatar')
);

// =============================================================================
// 파일 다운로드 및 조회
// =============================================================================

/**
 * @route GET /api/files/:fileId/download
 * @desc 파일 다운로드
 * @access Private
 * @params { fileId }
 * @query { thumbnail? }
 */
router.get('/:fileId/download',
  // authenticateToken, // TODO: 나중에 활성화
  // checkFilePermissions, // TODO: 나중에 활성화
  // decryptFile, // TODO: 나중에 활성화
  tempResponse('Download File')
  // downloadFile // TODO: 나중에 활성화
);

/**
 * @route GET /api/files/:fileId
 * @desc 파일 정보 조회
 * @access Private
 * @params { fileId }
 */
router.get('/:fileId',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { fileId } = req.params;
    
    res.json({
      message: 'File information',
      mockData: {
        id: fileId,
        filename: 'document_2024.pdf',
        originalName: 'Project Document 2024.pdf',
        mimeType: 'application/pdf',
        size: 2548736,
        formattedSize: '2.43 MB',
        uploadedBy: {
          id: 'user-456',
          name: 'John Doe',
          email: 'john@example.com'
        },
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isEncrypted: true,
        status: 'completed',
        downloadCount: 7,
        lastDownloaded: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        expiresAt: null,
        thumbnailPath: '/api/files/thumbnails/thumb_' + fileId + '.jpg',
        metadata: {
          width: null,
          height: null,
          duration: null,
          pages: 15,
          author: 'John Doe',
          createdDate: '2024-01-15T08:30:00.000Z'
        },
        chatId: 'chat-123',
        messageId: 'msg-456',
        tags: ['document', 'project', 'important'],
        isDeleted: false,
        accessHistory: [
          {
            userId: 'user-789',
            userName: 'Jane Smith',
            action: 'download',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          },
          {
            userId: 'user-101',
            userName: 'Mike Johnson',
            action: 'view',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    });
  }
);

/**
 * @route GET /api/files/:fileId/preview
 * @desc 파일 미리보기
 * @access Private
 * @params { fileId }
 * @query { page?, quality? }
 */
router.get('/:fileId/preview',
  // authenticateToken, // TODO: 나중에 활성화
  // checkFilePermissions, // TODO: 나중에 활성화
  tempResponse('Get File Preview')
  // getFilePreview // TODO: 나중에 활성화
);

/**
 * @route GET /api/files/:fileId/thumbnail
 * @desc 파일 썸네일 조회
 * @access Private
 * @params { fileId }
 * @query { size? }
 */
router.get('/:fileId/thumbnail',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { fileId } = req.params;
    const { size = 'medium' } = req.query;
    
    res.json({
      message: 'File thumbnail',
      note: 'In production, this would return actual image data',
      mockData: {
        fileId,
        thumbnailUrl: `/api/files/thumbnails/${size}_${fileId}.jpg`,
        size,
        dimensions: {
          small: { width: 150, height: 150 },
          medium: { width: 300, height: 300 },
          large: { width: 600, height: 600 }
        }[size],
        generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        cacheExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    });
  }
);

// =============================================================================
// 파일 관리
// =============================================================================

/**
 * @route PUT /api/files/:fileId
 * @desc 파일 정보 업데이트
 * @access Private
 * @params { fileId }
 * @body { originalName?, description?, tags? }
 */
router.put('/:fileId',
  // authenticateToken, // TODO: 나중에 활성화
  // checkFilePermissions, // TODO: 나중에 활성화
  tempResponse('Update File Info')
  // updateFileInfo // TODO: 나중에 활성화
);

/**
 * @route DELETE /api/files/:fileId
 * @desc 파일 삭제
 * @access Private
 * @params { fileId }
 */
router.delete('/:fileId',
  // authenticateToken, // TODO: 나중에 활성화
  // checkFilePermissions, // TODO: 나중에 활성화
  tempResponse('Delete File')
  // deleteFile // TODO: 나중에 활성화
);

/**
 * @route POST /api/files/:fileId/generate-thumbnail
 * @desc 썸네일 생성/재생성
 * @access Private
 * @params { fileId }
 * @body { sizes[]? }
 */
router.post('/:fileId/generate-thumbnail',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Generate Thumbnail')
  // generateThumbnail // TODO: 나중에 활성화
);

// =============================================================================
// 파일 공유
// =============================================================================

/**
 * @route POST /api/files/:fileId/share
 * @desc 파일 공유 링크 생성
 * @access Private
 * @params { fileId }
 * @body { expiresIn?, password?, allowDownload? }
 */
router.post('/:fileId/share',
  // authenticateToken, // TODO: 나중에 활성화
  // checkFilePermissions, // TODO: 나중에 활성화
  tempResponse('Share File')
  // shareFile // TODO: 나중에 활성화
);

/**
 * @route GET /api/files/shared/:shareToken
 * @desc 공유된 파일 접근
 * @access Public
 * @params { shareToken }
 * @query { password? }
 */
router.get('/shared/:shareToken',
  (req, res) => {
    const { shareToken } = req.params;
    const { password } = req.query;
    
    res.json({
      message: 'Shared file access',
      shareToken,
      mockData: {
        file: {
          id: 'shared-file-123',
          originalName: 'Shared Document.pdf',
          mimeType: 'application/pdf',
          size: 1024768,
          formattedSize: '1.02 MB',
          isPasswordProtected: !!password,
          allowDownload: true,
          downloadUrl: `/api/files/shared/${shareToken}/download`,
          previewUrl: `/api/files/shared/${shareToken}/preview`,
          sharedBy: {
            name: 'John Doe' // 공유자 정보는 제한적으로만 제공
          },
          sharedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          downloadCount: 3,
          maxDownloads: null
        },
        accessGranted: true
      }
    });
  }
);

/**
 * @route GET /api/files/shared/:shareToken/download
 * @desc 공유된 파일 다운로드
 * @access Public
 * @params { shareToken }
 * @query { password? }
 */
router.get('/shared/:shareToken/download',
  tempResponse('Download Shared File')
);

// =============================================================================
// 파일 목록 및 검색
// =============================================================================

/**
 * @route GET /api/files
 * @desc 사용자 파일 목록 조회
 * @access Private
 * @query { limit?, offset?, mimeType?, sortBy?, order?, search? }
 */
router.get('/',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { 
      limit = 50, 
      offset = 0, 
      mimeType, 
      sortBy = 'uploadedAt', 
      order = 'desc',
      search 
    } = req.query;
    
    const mockFiles = [
      {
        id: 'file-1',
        filename: 'presentation_2024.pptx',
        originalName: 'Team Presentation 2024.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 5242880,
        formattedSize: '5.00 MB',
        uploadedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        downloadCount: 2,
        thumbnailUrl: '/api/files/file-1/thumbnail',
        chatId: 'chat-123',
        status: 'completed'
      },
      {
        id: 'file-2',
        filename: 'budget_report.xlsx',
        originalName: 'Q4 Budget Report.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1048576,
        formattedSize: '1.00 MB',
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        downloadCount: 8,
        thumbnailUrl: '/api/files/file-2/thumbnail',
        chatId: 'chat-456',
        status: 'completed'
      },
      {
        id: 'file-3',
        filename: 'team_photo.jpg',
        originalName: 'Team Photo 2024.jpg',
        mimeType: 'image/jpeg',
        size: 3145728,
        formattedSize: '3.00 MB',
        uploadedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        downloadCount: 15,
        thumbnailUrl: '/api/files/file-3/thumbnail',
        chatId: 'chat-789',
        status: 'completed',
        metadata: {
          width: 1920,
          height: 1080,
          camera: 'Canon EOS R5'
        }
      },
      {
        id: 'file-4',
        filename: 'meeting_recording.mp4',
        originalName: 'Weekly Meeting Recording.mp4',
        mimeType: 'video/mp4',
        size: 104857600,
        formattedSize: '100.00 MB',
        uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        downloadCount: 1,
        thumbnailUrl: '/api/files/file-4/thumbnail',
        chatId: 'chat-101',
        status: 'completed',
        metadata: {
          duration: 3600,
          resolution: '1080p',
          codec: 'H.264'
        }
      }
    ];

    // 간단한 필터링 로직 (실제로는 데이터베이스에서 처리)
    let filteredFiles = mockFiles;
    
    if (mimeType) {
      filteredFiles = filteredFiles.filter(file => 
        file.mimeType.startsWith(mimeType)
      );
    }
    
    if (search) {
      filteredFiles = filteredFiles.filter(file => 
        file.originalName.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      message: 'User files',
      filters: { mimeType, search },
      sorting: { sortBy, order },
      mockData: {
        files: filteredFiles.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
        pagination: {
          total: filteredFiles.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < filteredFiles.length
        }
      }
    });
  }
);

/**
 * @route GET /api/files/chat/:chatId
 * @desc 특정 채팅방의 파일 목록 조회
 * @access Private
 * @params { chatId }
 * @query { limit?, offset?, mimeType? }
 */
router.get('/chat/:chatId',
  // authenticateToken, // TODO: 나중에 활성화
  // checkChatAccess, // TODO: 나중에 활성화
  (req, res) => {
    const { chatId } = req.params;
    const { limit = 50, offset = 0, mimeType } = req.query;
    
    res.json({
      message: 'Chat files',
      chatId,
      mockData: {
        files: [
          {
            id: 'chat-file-1',
            filename: 'meeting_notes.docx',
            originalName: 'Meeting Notes - Jan 15.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 524288,
            formattedSize: '512 KB',
            uploadedBy: {
              id: 'user-456',
              name: 'John Doe'
            },
            uploadedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            messageId: 'msg-789',
            downloadCount: 3,
            thumbnailUrl: `/api/files/chat-file-1/thumbnail`
          },
          {
            id: 'chat-file-2',
            filename: 'screenshot.png',
            originalName: 'Error Screenshot.png',
            mimeType: 'image/png',
            size: 1048576,
            formattedSize: '1.00 MB',
            uploadedBy: {
              id: 'user-789',
              name: 'Jane Smith'
            },
            uploadedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            messageId: 'msg-456',
            downloadCount: 1,
            thumbnailUrl: `/api/files/chat-file-2/thumbnail`,
            metadata: {
              width: 1366,
              height: 768
            }
          }
        ],
        pagination: {
          total: 2,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        },
        statistics: {
          totalFiles: 2,
          totalSize: 1572864,
          formattedTotalSize: '1.50 MB',
          fileTypes: {
            documents: 1,
            images: 1,
            videos: 0,
            others: 0
          }
        }
      }
    });
  }
);

/**
 * @route GET /api/files/search
 * @desc 파일 검색
 * @access Private
 * @query { q, mimeType?, limit?, offset?, chatId? }
 */
router.get('/search',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { q: query, mimeType, limit = 20, offset = 0, chatId } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query parameter "q"'
      });
    }

    res.json({
      message: 'File search results',
      query,
      filters: { mimeType, chatId },
      mockData: {
        files: [
          {
            id: 'search-file-1',
            filename: 'project_plan.pdf',
            originalName: `Project Plan with ${query}.pdf`,
            mimeType: 'application/pdf',
            size: 2097152,
            formattedSize: '2.00 MB',
            uploadedBy: {
              id: 'user-456',
              name: 'John Doe'
            },
            uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            chatId: 'chat-123',
            chatName: 'Project Discussion',
            downloadCount: 5,
            thumbnailUrl: '/api/files/search-file-1/thumbnail',
            matchScore: 0.95,
            matchedFields: ['originalName', 'description']
          }
        ],
        pagination: {
          total: 1,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        },
        searchStats: {
          totalMatches: 1,
          searchTime: '0.03s',
          indexedFiles: 1247
        }
      }
    });
  }
);

// =============================================================================
// 파일 통계 및 분석
// =============================================================================

/**
 * @route GET /api/files/stats
 * @desc 파일 통계 조회
 * @access Private
 * @query { period?, chatId? }
 */
router.get('/stats',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { period = '30d', chatId } = req.query;
    
    res.json({
      message: 'File statistics',
      period,
      scope: chatId ? 'specific_chat' : 'all_files',
      mockData: {
        overview: {
          totalFiles: 156,
          totalSize: 2147483648,
          formattedTotalSize: '2.00 GB',
          totalDownloads: 1247,
          uniqueDownloaders: 23,
          averageFileSize: 13778368,
          formattedAverageFileSize: '13.14 MB'
        },
        byType: {
          documents: { count: 67, size: 536870912, percentage: 25.0 },
          images: { count: 45, size: 1073741824, percentage: 50.0 },
          videos: { count: 12, size: 429496729, percentage: 20.0 },
          audio: { count: 8, size: 67108864, percentage: 3.1 },
          others: { count: 24, size: 40265318, percentage: 1.9 }
        },
        uploadTrend: [
          { date: '2024-01-01', count: 12, size: 134217728 },
          { date: '2024-01-02', count: 8, size: 67108864 },
          { date: '2024-01-03', count: 15, size: 201326592 }
        ],
        topUploaders: [
          {
            userId: 'user-456',
            name: 'John Doe',
            fileCount: 23,
            totalSize: 268435456,
            formattedSize: '256 MB'
          },
          {
            userId: 'user-789',
            name: 'Jane Smith',
            fileCount: 18,
            totalSize: 201326592,
            formattedSize: '192 MB'
          }
        ],
        storageQuota: {
          used: 2147483648,
          formattedUsed: '2.00 GB',
          total: 5368709120,
          formattedTotal: '5.00 GB',
          percentage: 40.0,
          remaining: 3221225472,
          formattedRemaining: '3.00 GB'
        }
      }
    });
  }
);

/**
 * @route GET /api/files/:fileId/history
 * @desc 파일 접근 히스토리 조회
 * @access Private
 * @params { fileId }
 * @query { limit?, offset? }
 */
router.get('/:fileId/history',
  // authenticateToken, // TODO: 나중에 활성화
  // checkFilePermissions, // TODO: 나중에 활성화
  (req, res) => {
    const { fileId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    res.json({
      message: 'File access history',
      fileId,
      mockData: {
        history: [
          {
            id: 'access-1',
            user: {
              id: 'user-789',
              name: 'Jane Smith',
              email: 'jane@example.com'
            },
            action: 'download',
            status: 'success',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            duration: 1245, // ms
            bytesTransferred: 2548736
          },
          {
            id: 'access-2',
            user: {
              id: 'user-101',
              name: 'Mike Johnson',
              email: 'mike@example.com'
            },
            action: 'view',
            status: 'success',
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            duration: 234,
            bytesTransferred: null
          },
          {
            id: 'access-3',
            user: {
              id: 'user-202',
              name: 'Sarah Wilson',
              email: 'sarah@example.com'
            },
            action: 'download',
            status: 'failed',
            errorMessage: 'File access denied',
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            duration: null,
            bytesTransferred: 0
          }
        ],
        pagination: {
          total: 3,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        },
        summary: {
          totalAccesses: 3,
          successfulAccesses: 2,
          failedAccesses: 1,
          uniqueUsers: 3,
          totalBytesTransferred: 2548736,
          averageAccessDuration: 740 // ms
        }
      }
    });
  }
);

/**
 * @route GET /api/files/storage
 * @desc 사용자 스토리지 정보 조회
 * @access Private
 */
router.get('/storage',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    res.json({
      message: 'Storage information',
      mockData: {
        current: {
          used: 2147483648,
          formattedUsed: '2.00 GB',
          fileCount: 156
        },
        quota: {
          total: 5368709120,
          formattedTotal: '5.00 GB',
          remaining: 3221225472,
          formattedRemaining: '3.00 GB',
          percentage: 40.0
        },
        breakdown: {
          documents: { size: 536870912, formattedSize: '512 MB', count: 67 },
          images: { size: 1073741824, formattedSize: '1.00 GB', count: 45 },
          videos: { size: 429496729, formattedSize: '409.6 MB', count: 12 },
          audio: { size: 67108864, formattedSize: '64 MB', count: 8 },
          others: { size: 40265318, formattedSize: '38.4 MB', count: 24 }
        },
        recommendations: [
          'Consider deleting old video files to free up space',
          'Archive documents older than 6 months',
          'Compress large image files'
        ],
        plan: {
          name: 'Premium',
          maxStorage: 5368709120,
          formattedMaxStorage: '5.00 GB',
          upgradeAvailable: true,
          nextPlan: {
            name: 'Pro',
            maxStorage: 21474836480,
            formattedMaxStorage: '20.00 GB',
            price: '$9.99/month'
          }
        }
      }
    });
  }
);

// =============================================================================
// 개발/테스트 엔드포인트
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  /**
   * @route GET /api/files/test
   * @desc 파일 라우터 테스트
   * @access Public
   */
  router.get('/test', (req, res) => {
    res.json({
      message: 'Files router test successful',
      timestamp: new Date().toISOString(),
      availableEndpoints: {
        upload: [
          'POST /api/files/upload',
          'POST /api/files/upload/avatar',
          'POST /api/files/upload/chat-avatar'
        ],
        download: [
          'GET /api/files/:fileId/download',
          'GET /api/files/:fileId',
          'GET /api/files/:fileId/preview',
          'GET /api/files/:fileId/thumbnail'
        ],
        management: [
          'PUT /api/files/:fileId',
          'DELETE /api/files/:fileId',
          'POST /api/files/:fileId/generate-thumbnail'
        ],
        sharing: [
          'POST /api/files/:fileId/share',
          'GET /api/files/shared/:shareToken',
          'GET /api/files/shared/:shareToken/download'
        ],
        listing: [
          'GET /api/files',
          'GET /api/files/chat/:chatId',
          'GET /api/files/search'
        ],
        analytics: [
          'GET /api/files/stats',
          'GET /api/files/:fileId/history',
          'GET /api/files/storage'
        ]
      },
      note: 'Most endpoints return 501 until controllers are implemented'
    });
  });

  /**
   * @route POST /api/files/mock-upload
   * @desc 목업 파일 업로드 (테스트용)
   */
  router.post('/mock-upload', (req, res) => {
    const { filename, mimeType, size, chatId } = req.body;
    
    if (!filename || !mimeType || !size) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['filename', 'mimeType', 'size']
      });
    }

    const mockFile = {
      id: `mock-file-${Date.now()}`,
      filename: filename.replace(/[^a-zA-Z0-9.-]/g, '_'),
      originalName: filename,
      mimeType,
      size: parseInt(size),
      formattedSize: formatFileSize(parseInt(size)),
      uploadedBy: {
        id: 'mock-user-123',
        name: 'Mock User'
      },
      uploadedAt: new Date().toISOString(),
      status: 'completed',
      isEncrypted: true,
      downloadCount: 0,
      chatId: chatId || null,
      downloadUrl: `/api/files/mock-file-${Date.now()}/download`,
      thumbnailUrl: `/api/files/mock-file-${Date.now()}/thumbnail`
    };

    res.status(201).json({
      message: 'Mock file upload successful',
      data: mockFile,
      note: 'This is a mock response for testing'
    });
  });

  /**
   * @route GET /api/files/mock/generate/:count
   * @desc 목업 파일 목록 생성 (테스트용)
   */
  router.get('/mock/generate/:count', (req, res) => {
    const count = Math.min(parseInt(req.params.count) || 10, 100);
    const mockFiles = [];
    
    const fileTypes = [
      { ext: 'pdf', mime: 'application/pdf', sizeRange: [100000, 5000000] },
      { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeRange: [50000, 2000000] },
      { ext: 'jpg', mime: 'image/jpeg', sizeRange: [200000, 8000000] },
      { ext: 'png', mime: 'image/png', sizeRange: [100000, 5000000] },
      { ext: 'mp4', mime: 'video/mp4', sizeRange: [10000000, 500000000] },
      { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sizeRange: [30000, 1000000] }
    ];

    for (let i = 1; i <= count; i++) {
      const fileType = fileTypes[i % fileTypes.length];
      const size = Math.floor(Math.random() * (fileType.sizeRange[1] - fileType.sizeRange[0])) + fileType.sizeRange[0];
      
      mockFiles.push({
        id: `mock-file-${i}`,
        filename: `mock_file_${i}.${fileType.ext}`,
        originalName: `Mock File ${i}.${fileType.ext}`,
        mimeType: fileType.mime,
        size,
        formattedSize: formatFileSize(size),
        uploadedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        downloadCount: Math.floor(Math.random() * 20),
        status: 'completed',
        chatId: `chat-${Math.floor(Math.random() * 5) + 1}`
      });
    }

    res.json({
      message: `Generated ${count} mock files`,
      files: mockFiles,
      note: 'These are mock files for testing purposes'
    });
  });
}

// 유틸리티 함수
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

console.log('✅ File management routes loaded');

module.exports = router;