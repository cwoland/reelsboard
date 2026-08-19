/** @type {import('next').NextConfig} */
export default {
  // pg тянет опциональные нативные модули — не бандлим его
  serverExternalPackages: ['pg', 'bcryptjs'],
};
