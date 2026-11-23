/**
 * Chat Module
 * Handles customer support chat functionality
 */

import { db } from '../firebase.js';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { escapeHTML, showToast } from '../utils.js';

/**
 * Load customer chat
 */
export function loadCustomerChat() {
  if (!state.currentUser) return;
  const chatId = state.currentUser.email || state.currentUser.phoneNumber || state.currentUser.uid;
  if (!chatId) return;

  if (state.unsubscribeUserChat) state.unsubscribeUserChat();

  state.unsubscribeUserChat = onSnapshot(doc(db, 'chats', chatId), (docSnap) => {
    const container = document.getElementById('support-history-container');
    if (!container) return;

    if (docSnap.exists()) {
      const data = docSnap.data();
      let html = '';
      (data.messages || []).forEach(m => {
        const isCust = m.sender === 'customer';
        const alignClass = isCust ? 'chat-msg-customer' : 'chat-msg-admin';
        const bubbleClass = isCust ? 'bubble-customer' : 'bubble-admin';
        const prefix = isCust ? '' : '<strong style="color:var(--secondary);font-size:0.8rem;">الدعم:</strong><br>';
        html += `<div class="chat-msg-wrapper ${alignClass}"><div class="chat-bubble ${bubbleClass}">${prefix}${escapeHTML(m.text)}</div></div>`;
      });
      container.innerHTML = html;
      container.scrollTop = container.scrollHeight;
    } else {
      const msg = state.currentLang === 'ar' ? 'ابدأ المحادثة الآن وسنرد عليك في أقرب وقت!' : 'Start the conversation now!';
      container.innerHTML = `<p style="text-align:center; color:var(--text-muted);">${msg}</p>`;
    }
  });
}

/**
 * Send customer message
 */
export async function sendSupportMessage() {
  const msgInput = document.getElementById('support-message');
  const txt = msgInput ? msgInput.value.trim() : "";
  if (!txt || !state.currentUser) return;
  msgInput.value = '';

  const chatId = state.currentUser.email || state.currentUser.phoneNumber || state.currentUser.uid;
  const dName = state.currentUser.displayName || (chatId.includes('@') ? chatId.split('@')[0] : chatId);
  const nowIso = new Date().toISOString();
  const replyIso = new Date(Date.now() + 1000).toISOString();

  const arMsg = (state.storeSettings.autoReplyMessage && state.storeSettings.autoReplyMessage.trim() !== '')
    ? state.storeSettings.autoReplyMessage.trim()
    : 'تم إرسال رسالتك بنجاح ✅ وبمجرد توفر موظف خدمة العملاء سيتم الرد عليك في أسرع وقت.';

  const msg = { sender: 'customer', text: txt, timestamp: nowIso };
  const replyObj = { sender: 'admin', text: arMsg, timestamp: replyIso, isAutoReply: true };

  try {
    const chatRef = doc(db, 'chats', chatId);
    const snap = await getDoc(chatRef);
    const existingMsgs = (snap.exists() && Array.isArray(snap.data().messages)) ? snap.data().messages : [];
    const isAdminReplied = snap.exists() && snap.data().adminReplied === true;

    if (state.storeSettings.appendHoursToAutoReply && state.storeSettings.workingHoursText) {
      replyObj.text = arMsg + "\n\n" + state.storeSettings.workingHoursText;
    }

    if (isAdminReplied || state.storeSettings.enableAutoReply === false) {
      existingMsgs.push(msg);
      await setDoc(chatRef, {
        customerName: dName,
        messages: existingMsgs,
        lastUpdate: nowIso,
        lastCustomerMsgAt: nowIso,
        unreadByAdmin: true
      }, { merge: true });
    } else {
      existingMsgs.push(msg, replyObj);
      await setDoc(chatRef, {
        customerName: dName,
        messages: existingMsgs,
        lastUpdate: replyIso,
        lastCustomerMsgAt: nowIso,
        adminReplied: false,
        unreadByAdmin: true
      }, { merge: true });
    }
    showToast('تم إرسال رسالتك بنجاح 💬', 'success');
  } catch (err) {
    console.error("Chat error:", err);
  }
}

/**
 * End chat
 */
export async function endChat() {
  if (confirm('إنهاء المحادثة؟')) {
    const chatId = state.currentUser.email || state.currentUser.phoneNumber || state.currentUser.uid;
    const msg = { sender: 'customer', text: '--- تم إنهاء المحادثة من العميل ---', timestamp: new Date().toISOString() };
    await updateDoc(doc(db, 'chats', chatId), { messages: arrayUnion(msg), lastUpdate: msg.timestamp, adminReplied: false });
    showToast('تم إنهاء المحادثة', 'info');
  }
}

/**
 * Delete chat
 */
export async function deleteChat() {
  if (confirm('مسح سجلك؟')) {
    const chatId = state.currentUser.email || state.currentUser.phoneNumber || state.currentUser.uid;
    await deleteDoc(doc(db, 'chats', chatId));
    showToast('تم المسح', 'success');
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.loadCustomerChat = loadCustomerChat;
  window.sendSupportMessage = sendSupportMessage;
  window.endChat = endChat;
  window.deleteChat = deleteChat;
}

export default {
  loadCustomerChat,
  sendSupportMessage,
  endChat,
  deleteChat
};