
## Linux / macOS ##
#
# The system secret can only be set against a fresh database. This
# secret is used to encrypt the database and needs to be set to the same value every time the process (re-)starts.
# You can use /dev/urandom to generate a secret. But make sure that the secret must be the same anytime you define it.
# You could, for example, store the value somewhere.

export SECRETS_SYSTEM=$(export LC_CTYPE=C; cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

## Other systems ##
#
# While systems like Windows support creating random secrets, we will just use a fixed one for this example.
# Keep in mind that this assumes that you're running some type of linux-ish shell:
#
#   export SECRETS_SYSTEM=this_needs_to_be_the_same_always_and_also_very_$3cuR3-._


echo $SECRETS_SYSTEM
