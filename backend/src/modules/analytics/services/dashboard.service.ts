import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dashboard } from '../entities/dashboard.entity';
import { DashboardWidget } from '../entities/dashboard-widget.entity';
import { CreateDashboardDto, UpdateDashboardDto, CreateWidgetDto, UpdateWidgetDto } from '../dto/dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Dashboard)
    private readonly dashboardRepository: Repository<Dashboard>,
    @InjectRepository(DashboardWidget)
    private readonly widgetRepository: Repository<DashboardWidget>,
  ) {}

  /**
   * Create a new dashboard
   */
  async create(userId: string, createDto: CreateDashboardDto): Promise<Dashboard> {
    // If this is set as default, unset other defaults for this user
    if (createDto.isDefault) {
      await this.dashboardRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const dashboard = this.dashboardRepository.create({
      ...createDto,
      userId,
    });

    const savedDashboard = await this.dashboardRepository.save(dashboard);

    // Create widgets if provided
    if (createDto.widgets && createDto.widgets.length > 0) {
      const widgets = createDto.widgets.map((widgetDto) =>
        this.widgetRepository.create({
          ...widgetDto,
          dashboardId: savedDashboard.id,
        }),
      );
      await this.widgetRepository.save(widgets);
    }

    return await this.findOne(savedDashboard.id);
  }

  /**
   * Get all dashboards for a user
   */
  async findAll(userId: string, companyId?: string): Promise<Dashboard[]> {
    const query = this.dashboardRepository
      .createQueryBuilder('dashboard')
      .leftJoinAndSelect('dashboard.widgets', 'widgets')
      .where('dashboard.userId = :userId OR dashboard.isPublic = true', { userId })
      .orderBy('dashboard.isDefault', 'DESC')
      .addOrderBy('dashboard.createdAt', 'DESC');

    if (companyId) {
      query.andWhere('(dashboard.companyId = :companyId OR dashboard.companyId IS NULL)', {
        companyId,
      });
    }

    return await query.getMany();
  }

  /**
   * Get a single dashboard
   */
  async findOne(id: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id },
      relations: ['widgets'],
    });

    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }

    return dashboard;
  }

  /**
   * Get default dashboard for a user
   */
  async findDefault(userId: string): Promise<Dashboard | null> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { userId, isDefault: true },
      relations: ['widgets'],
    });

    return dashboard;
  }

  /**
   * Update a dashboard
   */
  async update(id: string, userId: string, updateDto: UpdateDashboardDto): Promise<Dashboard> {
    const dashboard = await this.findOne(id);

    // Check ownership
    if (dashboard.userId !== userId && !dashboard.isPublic) {
      throw new BadRequestException('You do not have permission to update this dashboard');
    }

    // If setting as default, unset other defaults
    if (updateDto.isDefault && !dashboard.isDefault) {
      await this.dashboardRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(dashboard, updateDto);
    return await this.dashboardRepository.save(dashboard);
  }

  /**
   * Delete a dashboard
   */
  async remove(id: string, userId: string): Promise<void> {
    const dashboard = await this.findOne(id);

    if (dashboard.userId !== userId) {
      throw new BadRequestException('You do not have permission to delete this dashboard');
    }

    await this.dashboardRepository.remove(dashboard);
  }

  /**
   * Add widget to dashboard
   */
  async addWidget(dashboardId: string, createDto: CreateWidgetDto): Promise<DashboardWidget> {
    const dashboard = await this.findOne(dashboardId);

    const widget = this.widgetRepository.create({
      ...createDto,
      dashboardId: dashboard.id,
    });

    return await this.widgetRepository.save(widget);
  }

  /**
   * Update widget
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updateDto: UpdateWidgetDto,
  ): Promise<DashboardWidget> {
    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId, dashboardId },
    });

    if (!widget) {
      throw new NotFoundException(`Widget with ID ${widgetId} not found`);
    }

    Object.assign(widget, updateDto);
    return await this.widgetRepository.save(widget);
  }

  /**
   * Remove widget from dashboard
   */
  async removeWidget(dashboardId: string, widgetId: string): Promise<void> {
    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId, dashboardId },
    });

    if (!widget) {
      throw new NotFoundException(`Widget with ID ${widgetId} not found`);
    }

    await this.widgetRepository.remove(widget);
  }
}

