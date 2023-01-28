import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;
      const post = await fastify.db.posts.findOne({
        key: "id",
        equals: id,
      })
      if(!post) {
        throw fastify.httpErrors.notFound("Post not found!");
      }
      return post;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { userId } = request.body;
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: userId,
      })
      if(!user) {
        throw fastify.httpErrors.badRequest();
      }
      return await fastify.db.posts.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;
      const post = await fastify.db.posts.findOne({
        key: "id",
        equals: id,
      });

      if (!post) {
        throw fastify.httpErrors.badRequest();
      }
      return await fastify.db.posts.delete(id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;
      const post = await fastify.db.posts.findOne({
        key: "id",
        equals: id,
      });

      if (!post) {
        throw fastify.httpErrors.badRequest();
      }
      return await fastify.db.posts.change(id, request.body);
    }
  );
};

export default plugin;
