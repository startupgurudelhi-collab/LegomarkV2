import { Router } from 'express';
import healthRoutes from './health.routes';
import packageRoutes from './package.routes';
import serviceRoutes from './service.routes';
import authRoutes from './auth.routes';
import adminPackageRoutes from './admin-package.routes';
import founderRoutes from './founder.routes';
import officeRoutes from './office.routes';
import adminFounderRoutes from './admin-founder.routes';
import adminOfficeRoutes from './admin-office.routes';
import adminServiceCategoryRoutes from './admin-service-category.routes';
import adminServiceRoutes from './admin-service.routes';

const apiRouter = Router();

// Mount sub-routes under /api
apiRouter.use('/', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/packages', packageRoutes);
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/admin/packages', adminPackageRoutes);
apiRouter.use('/admin/service-categories', adminServiceCategoryRoutes);
apiRouter.use('/admin/services', adminServiceRoutes);
apiRouter.use('/founder', founderRoutes);
apiRouter.use('/office', officeRoutes);
apiRouter.use('/admin/founder', adminFounderRoutes);
apiRouter.use('/admin/office', adminOfficeRoutes);

export default apiRouter;

