import api from './api';

const userService = {
  async getProfile() {
    const res = await api.get('/me');
    return res.data;
  },
  async updateProfile(data) {
    const res = await api.patch('/me', data);
    return res.data;
  },
  async deleteAccount(password) {
    const res = await api.delete('/me', { data: { password } });
    return res.data;
  },
};

export default userService;
