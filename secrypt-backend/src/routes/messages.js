const express = require('express');
const router = express.Router();

console.log('📨 Loading message management routes...');

// TODO: 컨트롤러 import (나중에 생성 후 활성화)
// const {
//   getChatMessages,
//   sendMessage,
//   editMessage,
//   deleteMessage,
//   forwardMessage,
//   replyToMessage,
//   reactToMessage,
//   removeReaction,
//   getMessageReactions,
//   markAsRead,
//   markAllAsRead,
//   searchMessages,
//   getMessageHistory,
//   pinMessage,
//   unpinMessage,
//   getPinnedMessages,
//   reportMessage,
//   getUnreadCount
// } = require('../controllers/messageController');

// TODO: 미들웨어 import (나중에 생성 후 활성화)
// const { authenticateToken } = require('../middlewares/auth');
// const { validateMessage } = require('../middlewares/validation');
// const { checkChatAccess } = require('../middlewares/chatPermissions');
// const { encryptMessage } = require('../middlewares/encryption');

// 임시 응답 함수
const tempResponse = (action) => (req, res) => {
  res.status(501).json({
    message: `${action} endpoint not implemented yet`,
    note: 'Controller and middleware need to be created',
    receivedData: {
      body: req.body,
      params: req.params,
      query: req.query
    },
    timestamp: new Date().toISOString()
  });
};

// =============================================================================
// 메시지 조회
// =============================================================================

/**
 * @route GET /api/messages/chat/:chatId
 * @desc 채팅방의 메시지 목록 조회
 * @access Private
 * @params { chatId }
 * @query { limit?, offset?, before?, includeDeleted? }
 */
router.get('/chat/:chatId',
  // authenticateToken, // TODO: 나중에 활성화
  // checkChatAccess, // TODO: 나중에 활성화
  (req, res) => {
    const { chatId } = req.params;
    const { limit = 50, offset = 0, before, includeDeleted = false } = req.query;
    
    res.json({
      message: 'Chat messages',
      chatId,
      mockData: {
        messages: [
          {
            id: 'msg-1',
            content: 'Hello everyone! Welcome to our team chat.',
            type: 'text',
            chatId,
            sender: {
              id: 'user-456',
              name: 'John Doe',
              profileImage: null
            },
            isEncrypted: true,
            isEdited: false,
            editedAt: null,
            isDeleted: false,
            replyTo: null,
            forwardedFrom: null,
            reactions: [
              {
                emoji: '👍',
                count: 3,
                users: [
                  { id: 'user-789', name: 'Jane Smith' },
                  { id: 'user-101', name: 'Mike Johnson' }
                ],
                userReacted: false
              }
            ],
            file: null,
            metadata: {
              mentions: [],
              links: [],
              hashtags: []
            },
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            readBy: [
              {
                userId: 'user-789',
                readAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            id: 'msg-2',
            content: 'Thanks for setting this up!',
            type: 'text',
            chatId,
            sender: {
              id: 'user-789',
              name: 'Jane Smith',
              profileImage: null
            },
            isEncrypted: true,
            isEdited: false,
            editedAt: null,
            isDeleted: false,
            replyTo: {
              id: 'msg-1',
              content: 'Hello everyone! Welcome to our team chat.',
              sender: {
                id: 'user-456',
                name: 'John Doe'
              }
            },
            forwardedFrom: null,
            reactions: [],
            file: null,
            metadata: {
              mentions: ['user-456'],
              links: [],
              hashtags: []
            },
            createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            readBy: []
          },
          {
            id: 'msg-3',
            content: null,
            type: 'file',
            chatId,
            sender: {
              id: 'user-101',
              name: 'Mike Johnson',
              profileImage: null
            },
            isEncrypted: true,
            isEdited: false,
            editedAt: null,
            isDeleted: false,
            replyTo: null,
            forwardedFrom: null,
            reactions: [],
            file: {
              id: 'file-123',
              filename: 'project_document.pdf',
              originalName: 'Project Documentation.pdf',
              mimeType: 'application/pdf',
              size: 2048576,
              formattedSize: '2.05 MB'
            },
            metadata: {},
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            readBy: []
          },
          {
            id: 'msg-4',
            content: 'User Mike Johnson joined the chat',
            type: 'system',
            chatId,
            sender: null,
            isEncrypted: false,
            isEdited: false,
            editedAt: null,
            isDeleted: false,
            replyTo: null,
            forwardedFrom: null,
            reactions: [],
            file: null,
            metadata: {
              type: 'user_joined',
              userId: 'user-101'
            },
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            readBy: []
          }
        ],
        pagination: {
          total: 4,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        }
      }
    });
  }
);

/**
 * @route GET /api/messages/:messageId
 * @desc 특정 메시지 상세 조회
 * @access Private
 * @params { messageId }
 */
router.get('/:messageId',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { messageId } = req.params;
    
    res.json({
      message: 'Message details',
      mockData: {
        id: messageId,
        content: 'This is a detailed message view',
        type: 'text',
        chatId: 'chat-123',
        sender: {
          id: 'user-456',
          name: 'John Doe',
          profileImage: null,
          email: 'john@example.com'
        },
        isEncrypted: true,
        isEdited: true,
        editedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isDeleted: false,
        replyTo: null,
        forwardedFrom: null,
        reactions: [
          {
            id: 'reaction-1',
            emoji: '👍',
            reactionType: 'like',
            user: {
              id: 'user-789',
              name: 'Jane Smith'
            },
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          }
        ],
        file: null,
        metadata: {
          mentions: ['user-789'],
          links: ['https://example.com'],
          hashtags: ['important'],
          editHistory: [
            {
              editedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              previousContent: 'This was the original message'
            }
          ]
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        readBy: [
          {
            userId: 'user-789',
            userName: 'Jane Smith',
            readAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          }
        ]
      }
    });
  }
);

// =============================================================================
// 메시지 전송 및 수정
// =============================================================================

/**
 * @route POST /api/messages
 * @desc 새 메시지 전송
 * @access Private
 * @body { chatId, content, type?, replyTo?, fileId? }
 */
router.post('/',
  // authenticateToken, // TODO: 나중에 활성화
  // validateMessage, // TODO: 나중에 활성화
  // checkChatAccess, // TODO: 나중에 활성화
  // encryptMessage, // TODO: 나중에 활성화
  tempResponse('Send Message')
  // sendMessage // TODO: 나중에 활성화
);

/**
 * @route PUT /api/messages/:messageId
 * @desc 메시지 수정
 * @access Private
 * @params { messageId }
 * @body { content }
 */
router.put('/:messageId',
  // authenticateToken, // TODO: 나중에 활성화
  // validateMessage, // TODO: 나중에 활성화
  tempResponse('Edit Message')
  // editMessage // TODO: 나중에 활성화
);

/**
 * @route DELETE /api/messages/:messageId
 * @desc 메시지 삭제 (소프트 삭제)
 * @access Private
 * @params { messageId }
 * @query { deleteForEveryone? }
 */
router.delete('/:messageId',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Delete Message')
  // deleteMessage // TODO: 나중에 활성화
);

/**
 * @route POST /api/messages/:messageId/forward
 * @desc 메시지 전달
 * @access Private
 * @params { messageId }
 * @body { chatIds[] }
 */
router.post('/:messageId/forward',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Forward Message')
  // forwardMessage // TODO: 나중에 활성화
);

/**
 * @route POST /api/messages/reply
 * @desc 메시지에 답장
 * @access Private
 * @body { chatId, content, replyTo, type?, fileId? }
 */
router.post('/reply',
  // authenticateToken, // TODO: 나중에 활성화
  // validateMessage, // TODO: 나중에 활성화
  tempResponse('Reply to Message')
  // replyToMessage // TODO: 나중에 활성화
);

// =============================================================================
// 메시지 반응 (이모지)
// =============================================================================

/**
 * @route POST /api/messages/:messageId/reactions
 * @desc 메시지에 반응 추가/제거
 * @access Private
 * @params { messageId }
 * @body { emoji }
 */
router.post('/:messageId/reactions',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('React to Message')
  // reactToMessage // TODO: 나중에 활성화
);

/**
 * @route DELETE /api/messages/:messageId/reactions/:emoji
 * @desc 메시지 반응 제거
 * @access Private
 * @params { messageId, emoji }
 */
router.delete('/:messageId/reactions/:emoji',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Remove Reaction')
  // removeReaction // TODO: 나중에 활성화
);

/**
 * @route GET /api/messages/:messageId/reactions
 * @desc 메시지의 모든 반응 조회
 * @access Private
 * @params { messageId }
 */
router.get('/:messageId/reactions',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { messageId } = req.params;
    
    res.json({
      message: 'Message reactions',
      messageId,
      mockData: {
        reactions: [
          {
            id: 'reaction-1',
            emoji: '👍',
            reactionType: 'like',
            count: 3,
            users: [
              {
                id: 'user-789',
                name: 'Jane Smith',
                profileImage: null,
                reactedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
              },
              {
                id: 'user-101',
                name: 'Mike Johnson',
                profileImage: null,
                reactedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
              },
              {
                id: 'user-202',
                name: 'Sarah Wilson',
                profileImage: null,
                reactedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
              }
            ],
            userReacted: false
          },
          {
            id: 'reaction-2',
            emoji: '❤️',
            reactionType: 'love',
            count: 1,
            users: [
              {
                id: 'user-303',
                name: 'Alex Brown',
                profileImage: null,
                reactedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
              }
            ],
            userReacted: false
          }
        ],
        summary: {
          totalReactions: 4,
          totalUsers: 4,
          userReacted: false,
          popularEmojis: ['👍', '❤️']
        }
      }
    });
  }
);

// =============================================================================
// 읽음 처리
// =============================================================================

/**
 * @route POST /api/messages/:messageId/read
 * @desc 메시지를 읽음으로 표시
 * @access Private
 * @params { messageId }
 */
router.post('/:messageId/read',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Mark as Read')
  // markAsRead // TODO: 나중에 활성화
);

/**
 * @route POST /api/messages/chat/:chatId/read-all
 * @desc 채팅방의 모든 메시지를 읽음으로 표시
 * @access Private
 * @params { chatId }
 */
router.post('/chat/:chatId/read-all',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Mark All as Read')
  // markAllAsRead // TODO: 나중에 활성화
);

/**
 * @route GET /api/messages/unread-count
 * @desc 읽지 않은 메시지 개수 조회
 * @access Private
 * @query { chatId? }
 */
router.get('/unread-count',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { chatId } = req.query;
    
    if (chatId) {
      // 특정 채팅방의 읽지 않은 메시지 수
      res.json({
        message: 'Unread count for specific chat',
        chatId,
        mockData: {
          chatId,
          unreadCount: 7,
          lastReadMessageId: 'msg-123',
          oldestUnreadMessageId: 'msg-130'
        }
      });
    } else {
      // 전체 읽지 않은 메시지 수
      res.json({
        message: 'Total unread count',
        mockData: {
          totalUnreadCount: 23,
          chatUnreadCounts: [
            {
              chatId: 'chat-1',
              chatName: 'Team Chat',
              unreadCount: 7
            },
            {
              chatId: 'chat-2',
              chatName: null, // Direct chat
              otherUser: {
                id: 'user-456',
                name: 'John Doe'
              },
              unreadCount: 3
            },
            {
              chatId: 'chat-3',
              chatName: 'Project Discussion',
              unreadCount: 13
            }
          ]
        }
      });
    }
  }
);

// =============================================================================
// 메시지 검색
// =============================================================================

/**
 * @route GET /api/messages/search
 * @desc 메시지 검색
 * @access Private
 * @query { q, chatId?, limit?, offset?, type? }
 */
router.get('/search',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { q: query, chatId, limit = 20, offset = 0, type } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query parameter "q"'
      });
    }

    res.json({
      message: 'Message search results',
      query,
      filters: { chatId, type },
      mockData: {
        messages: [
          {
            id: 'msg-search-1',
            content: `This message contains the search term: ${query}`,
            type: 'text',
            chatId: 'chat-1',
            chatName: 'Team Discussion',
            sender: {
              id: 'user-456',
              name: 'John Doe',
              profileImage: null
            },
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            snippet: `...contains the search term: ${query} and some more...`,
            matchScore: 0.95
          },
          {
            id: 'msg-search-2',
            content: `Another message with ${query} in different context`,
            type: 'text',
            chatId: 'chat-2',
            chatName: null, // Direct chat
            otherUser: {
              id: 'user-789',
              name: 'Jane Smith'
            },
            sender: {
              id: 'user-789',
              name: 'Jane Smith',
              profileImage: null
            },
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            snippet: `...with ${query} in different context...`,
            matchScore: 0.87
          }
        ],
        pagination: {
          total: 2,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        },
        searchStats: {
          totalMatches: 2,
          searchTime: '0.05s',
          searchIn: chatId ? 'specific_chat' : 'all_chats'
        }
      }
    });
  }
);

// =============================================================================
// 메시지 고정 (Pin)
// =============================================================================

/**
 * @route POST /api/messages/:messageId/pin
 * @desc 메시지 고정
 * @access Private
 * @params { messageId }
 */
router.post('/:messageId/pin',
  // authenticateToken, // TODO: 나중에 활성화
  // checkChatPermissions('canPinMessages'), // TODO: 나중에 활성화
  tempResponse('Pin Message')
  // pinMessage // TODO: 나중에 활성화
);

/**
 * @route DELETE /api/messages/:messageId/pin
 * @desc 메시지 고정 해제
 * @access Private
 * @params { messageId }
 */
router.delete('/:messageId/pin',
  // authenticateToken, // TODO: 나중에 활성화
  // checkChatPermissions('canPinMessages'), // TODO: 나중에 활성화
  tempResponse('Unpin Message')
  // unpinMessage // TODO: 나중에 활성화
);

/**
 * @route GET /api/messages/chat/:chatId/pinned
 * @desc 채팅방의 고정된 메시지 목록 조회
 * @access Private
 * @params { chatId }
 */
router.get('/chat/:chatId/pinned',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { chatId } = req.params;
    
    res.json({
      message: 'Pinned messages',
      chatId,
      mockData: {
        pinnedMessages: [
          {
            id: 'msg-pinned-1',
            content: 'Important announcement: Team meeting tomorrow at 2 PM',
            type: 'text',
            sender: {
              id: 'user-admin',
              name: 'Team Admin',
              profileImage: null
            },
            pinnedBy: {
              id: 'user-admin',
              name: 'Team Admin'
            },
            pinnedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg-pinned-2',
            content: 'Please read the project guidelines document',
            type: 'text',
            sender: {
              id: 'user-lead',
              name: 'Project Lead',
              profileImage: null
            },
            pinnedBy: {
              id: 'user-lead',
              name: 'Project Lead'
            },
            pinnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        total: 2,
        maxPinnedMessages: 10
      }
    });
  }
);

// =============================================================================
// 메시지 히스토리 및 분석
// =============================================================================

/**
 * @route GET /api/messages/:messageId/history
 * @desc 메시지 수정 히스토리 조회
 * @access Private
 * @params { messageId }
 */
router.get('/:messageId/history',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    const { messageId } = req.params;
    
    res.json({
      message: 'Message edit history',
      messageId,
      mockData: {
        currentContent: 'This is the current message content',
        editHistory: [
          {
            id: 'edit-1',
            previousContent: 'This is the original message content',
            editedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            reason: 'typo correction'
          },
          {
            id: 'edit-2',
            previousContent: 'This was the first edit',
            editedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            reason: 'content update'
          }
        ],
        totalEdits: 2,
        originalCreatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        lastEditedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      }
    });
  }
);

/**
 * @route POST /api/messages/:messageId/report
 * @desc 메시지 신고
 * @access Private
 * @params { messageId }
 * @body { reason, description? }
 */
router.post('/:messageId/report',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Report Message')
  // reportMessage // TODO: 나중에 활성화
);

// =============================================================================
// 개발/테스트 엔드포인트
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  /**
   * @route GET /api/messages/test
   * @desc 메시지 라우터 테스트
   * @access Public
   */
  router.get('/test', (req, res) => {
    res.json({
      message: 'Messages router test successful',
      timestamp: new Date().toISOString(),
      availableEndpoints: {
        retrieval: [
          'GET /api/messages/chat/:chatId',
          'GET /api/messages/:messageId',
          'GET /api/messages/search',
          'GET /api/messages/unread-count'
        ],
        sending: [
          'POST /api/messages',
          'PUT /api/messages/:messageId',
          'DELETE /api/messages/:messageId',
          'POST /api/messages/:messageId/forward',
          'POST /api/messages/reply'
        ],
        reactions: [
          'POST /api/messages/:messageId/reactions',
          'DELETE /api/messages/:messageId/reactions/:emoji',
          'GET /api/messages/:messageId/reactions'
        ],
        readStatus: [
          'POST /api/messages/:messageId/read',
          'POST /api/messages/chat/:chatId/read-all'
        ],
        pinning: [
          'POST /api/messages/:messageId/pin',
          'DELETE /api/messages/:messageId/pin',
          'GET /api/messages/chat/:chatId/pinned'
        ],
        other: [
          'GET /api/messages/:messageId/history',
          'POST /api/messages/:messageId/report'
        ]
      },
      note: 'Most endpoints return 501 until controllers are implemented'
    });
  });

  /**
   * @route POST /api/messages/mock-send
   * @desc 목업 메시지 전송 (테스트용)
   */
  router.post('/mock-send', (req, res) => {
    const { chatId, content, type = 'text' } = req.body;
    
    if (!chatId || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['chatId', 'content']
      });
    }

    const mockMessage = {
      id: `mock-msg-${Date.now()}`,
      content,
      type,
      chatId,
      sender: {
        id: 'mock-user-123',
        name: 'Mock User',
        profileImage: null
      },
      isEncrypted: true,
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      replyTo: null,
      forwardedFrom: null,
      reactions: [],
      file: null,
      metadata: {
        mentions: [],
        links: [],
        hashtags: []
      },
      createdAt: new Date().toISOString(),
      readBy: []
    };

    res.status(201).json({
      message: 'Mock message sent successfully',
      data: mockMessage,
      note: 'This is a mock response for testing'
    });
  });

  /**
   * @route GET /api/messages/mock/generate/:chatId/:count
   * @desc 목업 메시지 생성 (테스트용)
   */
  router.get('/mock/generate/:chatId/:count', (req, res) => {
    const { chatId, count: countStr } = req.params;
    const count = Math.min(parseInt(countStr) || 10, 100);
    const mockMessages = [];
    
    const messageTypes = ['text', 'file', 'image', 'system'];
    const mockUsers = [
      { id: 'user-1', name: 'Alice Johnson' },
      { id: 'user-2', name: 'Bob Smith' },
      { id: 'user-3', name: 'Charlie Brown' },
      { id: 'user-4', name: 'Diana Wilson' }
    ];

    for (let i = 1; i <= count; i++) {
      const type = messageTypes[i % messageTypes.length];
      const sender = mockUsers[i % mockUsers.length];
      
      let content;
      let file = null;
      
      switch (type) {
        case 'text':
          content = `Mock message ${i}: This is a sample text message for testing purposes.`;
          break;
        case 'file':
          content = null;
          file = {
            id: `file-${i}`,
            filename: `document_${i}.pdf`,
            originalName: `Document ${i}.pdf`,
            mimeType: 'application/pdf',
            size: Math.floor(Math.random() * 5000000) + 100000
          };
          break;
        case 'image':
          content = null;
          file = {
            id: `image-${i}`,
            filename: `image_${i}.jpg`,
            originalName: `Image ${i}.jpg`,
            mimeType: 'image/jpeg',
            size: Math.floor(Math.random() * 2000000) + 50000
          };
          break;
        case 'system':
          content = `${sender.name} ${['joined the chat', 'left the chat', 'changed the chat name'][i % 3]}`;
          sender.id = null;
          sender.name = null;
          break;
      }

      mockMessages.push({
        id: `mock-msg-${i}`,
        content,
        type,
        chatId,
        sender: type === 'system' ? null : sender,
        isEncrypted: type !== 'system',
        isEdited: Math.random() > 0.9,
        editedAt: Math.random() > 0.9 ? new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString() : null,
        isDeleted: false,
        replyTo: i > 5 && Math.random() > 0.8 ? {
          id: `mock-msg-${i - Math.floor(Math.random() * 3) - 1}`,
          content: 'Previous message content'
        } : null,
        forwardedFrom: null,
        reactions: Math.random() > 0.7 ? [
          {
            emoji: ['👍', '❤️', '😂', '😮'][Math.floor(Math.random() * 4)],
            count: Math.floor(Math.random() * 5) + 1,
            userReacted: Math.random() > 0.5
          }
        ] : [],
        file,
        metadata: {
          mentions: [],
          links: [],
          hashtags: []
        },
        createdAt: new Date(Date.now() - (count - i) * 60 * 1000).toISOString(),
        readBy: []
      });
    }

    res.json({
      message: `Generated ${count} mock messages for chat ${chatId}`,
      chatId,
      messages: mockMessages,
      note: 'These are mock messages for testing purposes'
    });
  });
}

console.log('✅ Message management routes loaded');

module.exports = router;