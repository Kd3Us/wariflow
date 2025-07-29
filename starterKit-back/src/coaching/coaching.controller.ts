import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TokenAuthGuard } from '../common/guards/token-auth.guard';
import { CoachingService } from './coaching.service';

@ApiTags('coaching')
@ApiBearerAuth()
@UseGuards(TokenAuthGuard)
@Controller('coaching')
export class CoachingController {
  constructor(private readonly coachingService: CoachingService) {}

  @Get('coaches')
  getAllCoaches(@Query() filters: any) {
    return this.coachingService.findAllCoaches(filters);
  }

  @Get('coaches/search')
  searchCoaches(@Query('q') searchTerm: string) {
    return this.coachingService.searchCoaches(searchTerm);
  }

  @Post('coaches/match')
  findMatchingCoaches(@Body() criteria: any) {
    return this.coachingService.findMatchingCoaches(criteria);
  }

  @Get('coaches/:id')
  getCoachById(@Param('id') id: string) {
    return this.coachingService.findCoachById(id);
  }

  @Get('coaches/:id/availability')
  getCoachAvailability(@Param('id') coachId: string) {
    return this.coachingService.getCoachAvailability(coachId);
  }

  @Get('coaches/:id/reviews')
  getCoachReviews(@Param('id') coachId: string) {
    return this.coachingService.getCoachReviews(coachId);
  }

  @Post('sessions')
  bookSession(@Body() sessionData: any) {
    return this.coachingService.bookSession(sessionData);
  }

  @Get('sessions')
  getUserSessions(@Query('userId') userId: string) {
    return this.coachingService.getUserSessions(userId);
  }

  @Get('sessions/:id')
  getSessionById(@Param('id') id: string) {
    return this.coachingService.getSessionById(id);
  }

  @Put('sessions/:id')
  updateSession(@Param('id') id: string, @Body() updateData: any) {
    return this.coachingService.updateSession(id, updateData);
  }

  @Delete('sessions/:id')
  cancelSession(@Param('id') id: string) {
    return this.coachingService.cancelSession(id);
  }

  @Post('reviews')
  createReview(@Body() reviewData: any) {
    return this.coachingService.createReview(reviewData);
  }

  @Get('stats/dashboard')
  getDashboardStats(@Query('userId') userId: string) {
    return this.coachingService.getDashboardStats(userId);
  }

  @Post('notifications/reminder')
  sendSessionReminder(@Body() data: { sessionId: string, type: string }) {
    return this.coachingService.sendSessionReminder(data.sessionId, data.type);
  }
}