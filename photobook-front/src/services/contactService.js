import api from './api';

const contactService = {
  async send(data)             { return (await api.post('/contact', data)).data; },
  async getAll()               { return (await api.get('/contact')).data; },
  async getUnreadCount()       { return (await api.get('/contact/unread-count')).data; },
  async markAsRead(id)         { return (await api.patch(`/contact/${id}/read`)).data; },
  async reply(id, replyText)   { return (await api.post(`/contact/${id}/reply`, { reply: replyText })).data; },
  async delete(id)             { return (await api.delete(`/contact/${id}`)).data; },
};

export default contactService;
