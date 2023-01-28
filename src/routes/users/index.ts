import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: id,
      })
      if( !user) {
        throw fastify.httpErrors.notFound("User not found!");
      }
      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return await fastify.db.users.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: id,
      })
      if( !user) {
        throw fastify.httpErrors.badRequest();
      }

      const profile = await fastify.db.profiles.findOne({
        key: "userId",
        equals: id,
      });
      if (profile) {
        await fastify.db.profiles.delete(profile.id);
      }

      const posts = await fastify.db.posts.findMany({
        key: "userId",
        equals: id,
      });

      if (posts.length > 0) {
        posts.forEach((item) => {
          fastify.db.posts.delete(item.id);
        });
      }

      const subscribeToUsers = await fastify.db.users.findMany({
        key: "subscribedToUserIds",
        inArray: id,
      });

      if (subscribeToUsers.length > 0) {
        subscribeToUsers.forEach( (item) => {
          const arr = item.subscribedToUserIds.filter((el) => el !== id);
          fastify.db.users.change(item.id, {
            subscribedToUserIds: arr,
          });
        });
      }

      return await fastify.db.users.delete(id)
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const { userId } = request.body;

      const user1 = await fastify.db.users.findOne({
        key: "id",
        equals: id
      })
      if( !user1) {
        throw fastify.httpErrors.badRequest();
      }

      const user2 = await fastify.db.users.findOne({
        key: "id",
        equals: userId
      })
      if( !user2) {
        throw fastify.httpErrors.badRequest();
      }

      let resultArr = [...user2.subscribedToUserIds, id];

      return await fastify.db.users.change(userId, {
        subscribedToUserIds: resultArr
      })
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const { userId } = request.body;

      const user1 = await fastify.db.users.findOne({
        key: "id",
        equals: id
      })
      if( !user1) {
        throw fastify.httpErrors.badRequest();
      }

      const user2 = await fastify.db.users.findOne({
        key: "id",
        equals: userId
      })
      if( !user2) {
        throw fastify.httpErrors.badRequest();
      }


      if (!user2.subscribedToUserIds.find(el => el === id)) {
        throw fastify.httpErrors.badRequest();
      }

      const result = user2.subscribedToUserIds.filter(el => el !== id);


      return await fastify.db.users.change(userId, {
        subscribedToUserIds: result
      })
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: id
      })
      if( !user ) {
        throw fastify.httpErrors.badRequest();
      }
      return await fastify.db.users.change(id, request.body)
    }
  );
};

export default plugin;
