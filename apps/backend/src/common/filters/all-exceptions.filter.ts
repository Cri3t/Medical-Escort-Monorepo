import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@medical-escort/database';

interface ErrorResponse {
  code: number;
  data: null;
  message: string;
}

interface HttpResponseBody {
  message?: string | string[];
  error?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const { status, message } = this.resolveException(exception);
    const body: ErrorResponse = {
      code: status,
      data: null,
      message,
    };

    this.httpAdapterHost.httpAdapter.reply(response, body, status);
  }

  private resolveException(exception: unknown): {
    status: number;
    message: string;
  } {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: this.resolveHttpExceptionMessage(exception),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: '数据已存在，请勿重复提交',
        };
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '服务器内部错误',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误',
    };
  }

  private resolveHttpExceptionMessage(exception: HttpException): string {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    const responseBody = exceptionResponse as HttpResponseBody;
    const { message, error } = responseBody;

    if (Array.isArray(message)) {
      return message.join('; ');
    }

    if (typeof message === 'string') {
      return message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return exception.message || '请求失败';
  }
}
