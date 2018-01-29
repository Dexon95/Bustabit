CREATE EXTENSION plv8;



-- Users

CREATE TYPE UserClassEnum AS ENUM ('user', 'moderator', 'admin');

CREATE TABLE users (
    id bigint NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    username text NOT NULL,
    email text,
    password text NOT NULL,
    mfa_secret text,
    balance_satoshis bigint DEFAULT 0 NOT NULL,
    gross_profit bigint DEFAULT 0 NOT NULL,
    net_profit bigint DEFAULT 0 NOT NULL,
    games_played bigint DEFAULT 0 NOT NULL,
    userclass UserClassEnum DEFAULT 'user' NOT NULL,
    CONSTRAINT users_balance_satoshis_check CHECK ((balance_satoshis >= 0))
);

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX unique_username ON users USING btree (lower(username));
CREATE INDEX users_email_idx ON users USING btree (lower(email));
CREATE INDEX user_id_idx ON users USING btree (id);

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE users_id_seq OWNED BY users.id;

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);



-- Blocks

CREATE TABLE blocks (
    height integer NOT NULL,
    hash text NOT NULL
);

ALTER TABLE ONLY blocks
    ADD CONSTRAINT bv_blocks_pkey PRIMARY KEY (height, hash);



-- Fundings

CREATE TABLE fundings (
    id bigserial NOT NULL PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    amount bigint NOT NULL,
    bitcoin_withdrawal_txid text,
    bitcoin_withdrawal_address text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    bitcoin_deposit_txid text,
    withdrawal_id UUID,
    CONSTRAINT fundings_withdrawal_id_key UNIQUE (withdrawal_id)
);

ALTER TABLE ONLY fundings
    ADD CONSTRAINT fundings_user_id_bitcoin_deposit_txid_key UNIQUE (user_id, bitcoin_deposit_txid);

CREATE INDEX fundings_user_id_idx ON fundings USING btree (user_id);



-- Games

CREATE TABLE games (
    id bigint NOT NULL,
    game_crash bigint NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    ended boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY games ADD CONSTRAINT games_pkey PRIMARY KEY (id);

CREATE SEQUENCE games_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE games_id_seq OWNED BY games.id;

ALTER TABLE ONLY games ALTER COLUMN id SET DEFAULT nextval('games_id_seq'::regclass);



-- Giveaways

CREATE TABLE giveaways (
    amount bigint NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    user_id bigint NOT NULL,
    id bigint NOT NULL
);

CREATE INDEX giveaways_user_id_idx ON giveaways USING btree (user_id);

CREATE SEQUENCE giveaways_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE giveaways_id_seq OWNED BY giveaways.id;

ALTER TABLE ONLY giveaways ALTER COLUMN id SET DEFAULT nextval('giveaways_id_seq'::regclass);

ALTER TABLE ONLY giveaways ADD CONSTRAINT giveaways_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;



-- Plays

CREATE TABLE plays (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    cash_out bigint,
    auto_cash_out bigint NOT NULL,
    game_id bigint NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    bet bigint NOT NULL,
    bonus bigint
);

ALTER TABLE ONLY plays ADD CONSTRAINT plays_pkey PRIMARY KEY (id);

CREATE INDEX plays_game_id_idx ON plays USING btree (game_id);

CREATE INDEX plays_user_id_idx ON plays USING btree (user_id, id DESC);

ALTER TABLE ONLY plays ADD CONSTRAINT plays_game_id_fkey FOREIGN KEY (game_id) REFERENCES games(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY plays ADD CONSTRAINT plays_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE SEQUENCE plays_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE plays_id_seq OWNED BY plays.id;

ALTER TABLE ONLY plays ALTER COLUMN id SET DEFAULT nextval('plays_id_seq'::regclass);



-- Recovery

CREATE TABLE recovery (
    id uuid NOT NULL PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    ip inet NOT NULL,
    created timestamp with time zone DEFAULT now(),
    expired timestamp with time zone DEFAULT now() + interval '15 minutes',
    used boolean NOT NULL DEFAULT false
);
CREATE INDEX fki_foreing_user_id ON recovery USING btree (user_id);



-- Sessions:
    -- Regular sessions for users and one time tokens for the cross origin connection to the game server
    -- Ott allows to let the session is http only

CREATE TABLE sessions (
    id uuid NOT NULL,
    user_id bigint NOT NULL,
    ip_address inet NOT NULL,
    user_agent text,
    ott boolean DEFAULT false,
    created timestamp with time zone NOT NULL DEFAULT now(),
    expired timestamp with time zone NOT NULL DEFAULT now() + interval '21 days'
);

ALTER TABLE ONLY sessions
    ADD CONSTRAINT unique_id PRIMARY KEY (id);

CREATE INDEX sessions_user_id_idx ON sessions USING btree (user_id, expired);



-- Users View

CREATE VIEW users_view AS
 SELECT u.id,
    u.created,
    u.username,
    u.email,
    u.password,
    u.mfa_secret,
    u.balance_satoshis,
    ( SELECT max(giveaways.created) AS max
           FROM giveaways
          WHERE (giveaways.user_id = u.id)) AS last_giveaway,
    u.userclass
   FROM users u;



CREATE TABLE game_hashes
(
 game_id bigint NOT NULL,
 hash text NOT NULL,
 CONSTRAINT game_hashes_pkey PRIMARY KEY (game_id)
);



-- Leaderboard View

CREATE MATERIALIZED VIEW leaderboard AS
 SELECT id as user_id,
        username,
        gross_profit,
        net_profit,
        games_played,
        rank() OVER (ORDER BY gross_profit DESC) AS rank
   FROM users;

CREATE UNIQUE INDEX leaderboard_user_id_idx
  ON leaderboard
  USING btree
  (user_id);

CREATE INDEX leaderboard_username_idx ON leaderboard USING btree (lower(username));

CREATE INDEX leaderboard_gross_profit_idx ON leaderboard USING btree (gross_profit);

CREATE INDEX leaderboard_net_profit_idx ON leaderboard USING btree (net_profit);



-- Chat messages

CREATE TABLE chat_messages
(
  id bigserial NOT NULL PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id),
  message text NOT NULL,
  created timestamp with time zone DEFAULT now() NOT NULL,
  is_bot boolean NOT NULL,
  channel text NOT NULL
);

CREATE INDEX chat_messages_user_id_idx ON chat_messages USING btree(user_id);
CREATE INDEX chat_messages_channel_id_idx ON chat_messages USING btree(channel, id);



-- User stats

CREATE OR REPLACE FUNCTION plays_users_stats_trigger()
  RETURNS trigger AS $$

    if (TG_OP === 'UPDATE' && OLD.user_id !== NEW.user_id)
      throw new Error('Update of user_id not allowed');

    var userId, gross = 0, net = 0, num = 0;
    var bet, cashOut, bonus;

    // Add new values.
    if (NEW) {
      userId  = NEW.user_id;
      bet     = NEW.bet;
      bonus   = NEW.bonus || 0;
      cashOut = NEW.cash_out || 0;

      gross  += Math.max(cashOut - bet, 0) + bonus;
      net    += (cashOut - bet) + bonus;
      num    += 1;
    }

    // Subtract old values
    if (OLD) {
      userId  = OLD.user_id;
      bet     = OLD.bet;
      bonus   = OLD.bonus || 0;
      cashOut = OLD.cash_out || 0;

      gross  -= Math.max(cashOut - bet, 0) + bonus;
      net    -= (cashOut - bet) + bonus;
      num    -= 1;
    }

    var sql =
      'UPDATE users ' +
      '  SET gross_profit = gross_profit + $1, ' +
      '      net_profit   = net_profit   + $2, ' +
      '      games_played = games_played + $3 ' +
      '  WHERE id = $4';
    var par = [gross,net,num,userId];
    plv8.execute(sql,par);
$$ LANGUAGE plv8;

CREATE TRIGGER plays_users_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON plays
    FOR EACH ROW EXECUTE PROCEDURE plays_users_stats_trigger();