import api from './api';

const contactService = {
  async send(data) {
    const res = await api.post('/contact', data);
    return res.data;
  },
  async getAll() {
    const res = await api.get('/contact');
    return res.data;
  },
  async markAsRead(id) {
    const res = await api.patch(`/contact/${id}/read`);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/contact/${id}`);
    return res.data;
  },
};

export default contactService;
