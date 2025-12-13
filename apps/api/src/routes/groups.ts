import { FastifyPluginAsync } from 'fastify';
import { CreateGroupSchema, CreateGroupEventSchema } from '@runflow/schemas';
import { createAuthenticatedClient } from '@runflow/db';
import { loadConfig } from '../config';

export const groupsRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /me/groups - Create a group
  fastify.post(
    '/',
    {
      schema: {
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              visibility: { type: 'string' }
            }
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      const parseResult = CreateGroupSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply
          .status(400)
          .send({ error: 'Validation Error', details: parseResult.error });
      }
      const { name, description, visibility } = parseResult.data;

      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const config = loadConfig();
      const client = createAuthenticatedClient(
        {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        },
        token
      );
      try {
        const { data: debugInfo, error: rpcError } =
          await client.rpc('get_auth_debug');
        if (rpcError) console.error('RPC ERROR:', rpcError);
        else console.log('DEBUG AUTH:', JSON.stringify(debugInfo, null, 2));
      } catch (e) {
        console.error('RPC EXCEPTION:', e);
      }

      const {
        data: { user: authUser },
        error: authError
      } = await client.auth.getUser();
      console.log('CLIENT AUTH USER ID:', authUser?.id);
      if (authError || !authUser)
        return reply.status(401).send({ error: 'Unauthorized' });

      // Create Group
      const { data: group, error } = await client
        .from('groups')
        .insert({
          name,
          description,
          visibility,
          owner_id: authUser.id
        })
        .select('id, name, visibility')
        .single();

      if (error) {
        console.error('FULL DB ERROR:', error);
        request.log.error(error);
        if (error.code === '23505') {
          // Unique violation
          return reply.status(409).send({ error: 'Group name already taken' });
        }
        return reply
          .status(500)
          .send({
            error: 'Database Error',
            message: error.message,
            details: error
          });
      }

      // Automatically add owner as admin member
      const { error: memberError } = await client.from('group_members').insert({
        group_id: group.id,
        user_id: authUser.id,
        role: 'admin'
      });

      if (memberError) {
        request.log.error(memberError, 'Failed to add owner as member');
      }

      return reply.status(201).send(group);
    }
  );

  // POST /me/groups/:id/join - Join a group
  fastify.post(
    '/:id/join',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' } } },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          403: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const config = loadConfig();
      const client = createAuthenticatedClient(
        {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        },
        token
      );
      const {
        data: { user: authUser },
        error: authError
      } = await client.auth.getUser();
      if (authError || !authUser)
        return reply.status(401).send({ error: 'Unauthorized' });

      const { error } = await client.from('group_members').insert({
        group_id: id,
        user_id: authUser.id,
        role: 'member'
      });

      if (error) {
        console.log('JOIN ERROR CODE:', error.code);
        console.log('JOIN ERROR MESSAGE:', error.message);
        if (error.code === '23505')
          return reply.status(409).send({ error: 'Already a member' });
        if (error.code === '42501')
          return reply.status(403).send({ error: 'Cannot join this group' });
        return reply
          .status(500)
          .send({ error: 'Failed to join group', details: error.message });
      }

      return reply.send({ success: true });
    }
  );

  // POST /me/groups/:id/leave - Leave a group
  fastify.post(
    '/:id/leave',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' } } },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const config = loadConfig();
      const client = createAuthenticatedClient(
        {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        },
        token
      );
      const {
        data: { user: authUser },
        error: authError
      } = await client.auth.getUser();
      if (authError || !authUser)
        return reply.status(401).send({ error: 'Unauthorized' });

      const { error } = await client
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', authUser.id);

      if (error) return reply.status(500).send({ error: error.message });
      return reply.send({ success: true });
    }
  );

  // GET /me/groups - List my groups
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
                visibility: { type: 'string' },
                owner_id: { type: 'string' },
                my_role: { type: 'string' },
                joined_at: { type: 'string' }
              }
            }
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const config = loadConfig();
      const client = createAuthenticatedClient(
        {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        },
        token
      );
      const {
        data: { user: authUser },
        error: authError
      } = await client.auth.getUser();
      if (authError || !authUser)
        return reply.status(401).send({ error: 'Unauthorized' });

      const { data, error } = await client
        .from('group_members')
        .select(
          `
                group:groups (
                    id,
                    name,
                    description,
                    visibility,
                    owner_id
                ),
                role,
                joined_at
            `
        )
        .eq('user_id', authUser.id);

      if (error) return reply.status(500).send({ error: error.message });

      const groups = data.map((item) => ({
        ...(item.group as {
          id: string;
          name: string;
          description: string | null;
          visibility: string;
          owner_id: string;
        }),
        my_role: item.role,
        joined_at: item.joined_at
      }));

      return reply.send(groups);
    }
  );

  // GET /me/groups/:id/events - List events
  fastify.get(
    '/:id/events',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true // Allow dynamic fields for now
            }
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          403: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const config = loadConfig();
      const client = createAuthenticatedClient(
        {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        },
        token
      );
      const {
        data: { user: authUser },
        error: authError
      } = await client.auth.getUser();
      if (authError || !authUser)
        return reply.status(401).send({ error: 'Unauthorized' });

      const { data: member } = await client
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', authUser.id)
        .single();

      if (!member)
        return reply.status(403).send({ error: 'Not a member of this group' });

      const { data: events, error } = await client
        .from('group_events')
        .select('*')
        .eq('group_id', id)
        .order('start_time', { ascending: true });

      if (error) return reply.status(500).send({ error: error.message });
      return reply.send(events);
    }
  );

  // POST /me/groups/:id/events - Create event
  fastify.post(
    '/:id/events',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          201: {
            type: 'object',
            additionalProperties: true
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          403: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parseResult = CreateGroupEventSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply
          .status(400)
          .send({ error: 'Validation Error', details: parseResult.error });
      }
      const { title, description, startTime, location } = parseResult.data;

      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const config = loadConfig();
      const client = createAuthenticatedClient(
        {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        },
        token
      );
      const {
        data: { user: authUser },
        error: authError
      } = await client.auth.getUser();
      if (authError || !authUser)
        return reply.status(401).send({ error: 'Unauthorized' });

      const { data: member } = await client
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', authUser.id)
        .single();

      if (!member) return reply.status(403).send({ error: 'Not a member' });

      const { data, error } = await client
        .from('group_events')
        .insert({
          group_id: id,
          creator_id: authUser.id,
          title,
          description,
          start_time: startTime,
          location
        })
        .select()
        .single();

      if (error) return reply.status(500).send({ error: error.message });
      return reply.status(201).send(data);
    }
  );
};
