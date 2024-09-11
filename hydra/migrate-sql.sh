

# The hydra migrate sql command initializes the database. 
# This command is to be run any time the database
# must be initialized.  Ergo, it should be run once.

# Pre-define Data Source Name (DSN)

# For a database like Postgres or MySQL, the database
# is available on a URL.  The DSN must reflect that URL.

# docker run -it --rm \
#   --network hydra \
#   ${HYDRA_IMAGE} \
#   migrate sql --yes ${DSN}


# When using SQLITE, the SQLITE file must be mounted
# into the container.  This volume mount binds the
# local file into the container at a predefined location.
# The same bind mount must be used in the Compose file
# for the Hydra container.

docker run -it --rm \
  --network hydra \
  -v ${DSN_PATH}:/var/lib/sqlite/db.sqlite:rw \
  -e DSN=${DSN} \
  -e SECRETS_SYSTEM=${SECRETS_SYSTEM} \
  ${HYDRA_IMAGE} \
  migrate sql --yes ${DSN}



# An alternate is to put this in a Docker Compose file.
# But, what's the purpose of doing so?
#
# This came from:
# https://github.com/ory/hydra/blob/master/quickstart.yml

#   hydra-migrate:
#     image: oryd/hydra:v2.2.0
#     environment:
#       - DSN=sqlite:///var/lib/sqlite/db.sqlite?_fk=true
#     command: migrate -c /etc/config/hydra/hydra.yml sql -e --yes
#     volumes:
#       - type: volume
#         source: hydra-sqlite
#         target: /var/lib/sqlite
#         read_only: false
#       - type: bind
#         source: ./contrib/quickstart/5-min
#         target: /etc/config/hydra
#     restart: on-failure
#     networks:
#       - intranet