import { Router } from 'express';
import {closeConversation,createConversation,getConversationById,getConversationMessages,getConversations,sendConversationMessage} from './messaging.controller';
import {conversationIdValidator,createConversationValidator,getConversationsValidator,getMessagesValidator,sendMessageValidator} from './messaging.validator';
const router = Router();

//business facing API

// get all conversations for the current user/organization
router.get('/conversations', getConversationsValidator, getConversations);

// create a conversation for a store, this also creates the participants for the conversation and the first system/user messages
router.post('/conversations', createConversationValidator, createConversation);

// get a specific conversation by its id
router.get('/conversations/:id', conversationIdValidator, getConversationById);

// get messages in a specific conversation
router.get('/conversations/:id/messages', getMessagesValidator, getConversationMessages);

// send a message in a specific conversation
router.post('/conversations/:id/messages', sendMessageValidator, sendConversationMessage);

// close a specific conversation
router.post('/conversations/:id/close', conversationIdValidator, closeConversation);

export default router;
