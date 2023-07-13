import base64
import binascii
import datetime
import hashlib
import hmac
import os
from typing import Union
import re


INFO_BITS = bytearray('Caldera Derived Key', 'utf-8')


def hexstr2int(num: str) -> int:
    """BigInteger"""
    return int(num, 16)


def int2hexstr(num: int) -> str:
    return f'{num:x}'


def hash_sha256(buf):
    a = hashlib.sha256(buf).hexdigest()
    return (64 - len(a)) * '0' + a


def hexhash(hexstr: str) -> str:
    """AuthenticationHelper.hexHash"""
    return hash_sha256(bytearray.fromhex(hexstr))


def get_secret_hash(username, client_id, client_secret):
    msg = bytearray(username + client_id, 'UTF-8')
    key = bytearray(client_secret, 'UTF-8')
    sig = hmac.new(key, msg, digestmod=hashlib.sha256).digest()
    return base64.standard_b64encode(sig).decode('UTF-8')


def calculate_u(A: int, B: int) -> int:
    u_hexhash = hexhash(pad_hex(A) + pad_hex(B))
    return hexstr2int(u_hexhash)


def pad_hex(num: Union[int, str]) -> str:
    if isinstance(num, int):
        hashstr = int2hexstr(num)
    else:
        hashstr = num

    if len(hashstr) % 2 == 1:
        return f'0{hashstr}'
    elif hashstr[0] in '89ABCDEFabcdef':
        return f'00{hashstr}'
    else:
        return hashstr


def compute_hkdf(ikm, salt) -> str:
    prk = hmac.new(salt, ikm, digestmod=hashlib.sha256).digest()
    info_bits = INFO_BITS + bytearray(chr(1), 'utf-8')
    hmac_hash = hmac.new(prk, info_bits, digestmod=hashlib.sha256).digest()
    return hmac_hash[:16]


class AuthenticationHelper:

    N_hex = \
        'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' + \
        '29024E088A67CC74020BBEA63B139B22514A08798E3404DD' + \
        'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' + \
        'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' + \
        'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D' + \
        'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F' + \
        '83655D23DCA3AD961C62F356208552BB9ED529077096966D' + \
        '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' + \
        'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9' + \
        'DE2BCBF6955817183995497CEA956AE515D2261898FA0510' + \
        '15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64' + \
        'ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7' + \
        'ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B' + \
        'F12FFA06D98A0864D87602733EC86A64521F2B18177B200C' + \
        'BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31' + \
        '43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF'
    g_hex = '2'

    N = hexstr2int(N_hex)
    g = hexstr2int(g_hex)
    k = hexstr2int(hexhash('00' + N_hex + '0' + g_hex))

    def __init__(
            self,
            username: str,
            password: str,
            user_pool_id: str,
            client_id: str,
            client_secret: Union[str, None]):
        self.username = username
        self.password = password
        self.user_pool_id = user_pool_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.a = self.generate_random_small_a()
        self.A = self.calculate_large_a(self.a)

    @staticmethod
    def generate_random_small_a() -> int:
        """AuthenticationHelper.generateRandomSmallA"""
        random_hex = binascii.hexlify(os.urandom(128))
        random_int = hexstr2int(random_hex)
        return random_int % AuthenticationHelper.N

    @staticmethod
    def calculate_large_a(a: int) -> int:
        """AuthenticationHelper.calculateA"""
        N = AuthenticationHelper.N
        g = AuthenticationHelper.g
        A = pow(g, a, N)
        if (A % N) == 0:
            raise ValueError('Safety check for A failed')
        return A

    def get_password_authentication_key(self, B: int, salt: str) -> str:
        N = AuthenticationHelper.N
        g = AuthenticationHelper.g
        k = AuthenticationHelper.k
        u = calculate_u(self.A, B)
        if u == 0:
            raise ValueError('u cannot be 0')
        username_password = '{}{}:{}'.format(
            self.user_pool_id.split('_')[1],
            self.username,
            self.password
        )
        username_password_hash = hash_sha256(username_password.encode('utf-8'))
        x = hexstr2int(hexhash(pad_hex(salt) + username_password_hash))
        s = pow(
            B - k * pow(g, x, N),
            self.a + u * x,
            N)
        hkdf = compute_hkdf(
            bytearray.fromhex(pad_hex(s)),
            bytearray.fromhex(pad_hex(int2hexstr(u)))
        )
        return hkdf

    def get_auth_parameters(self) -> dict:
        auth_parameters = {
            'USERNAME': self.username,
            'SRP_A': int2hexstr(self.A)}
        if self.client_secret is not None:
            auth_parameters['SECRET_HASH'] = get_secret_hash(
                self.username, self.client_id, self.client_secret)
        return auth_parameters

    def get_challenge_responses_new_password_required(
            self, challenge_parameters: dict, new_password: str) -> dict:
        challenge_responses = {
            'USERNAME': self.username,
            'NEW_PASSWORD': new_password
        }
        if self.client_secret is not None:
            challenge_responses['SECRET_HASH'] = get_secret_hash(
                self.username, self.client_id, self.client_secret)
        return challenge_responses

    def get_challenge_responses_password_verifier(
            self, challenge_parameters: dict) -> dict:
        timestamp = re.sub(
            r' 0(\d) ',
            r' \1 ',
            datetime.datetime.utcnow().strftime('%a %b %d %H:%M:%S UTC %Y'))
        hkdf = self.get_password_authentication_key(
            hexstr2int(challenge_parameters['SRP_B']),
            challenge_parameters['SALT'])
        secret_block = base64.standard_b64decode(
            challenge_parameters['SECRET_BLOCK'])
        msg = \
            bytearray(self.user_pool_id.split('_')[1], 'utf-8') + \
            bytearray(challenge_parameters['USER_ID_FOR_SRP'], 'utf-8') + \
            bytearray(secret_block) + \
            bytearray(timestamp, 'utf-8')
        sig = hmac.new(hkdf, msg, digestmod=hashlib.sha256).digest()
        sig_str = base64.standard_b64encode(sig).decode('utf-8')

        challenge_responses = {
            'TIMESTAMP': timestamp,
            'USERNAME': challenge_parameters['USER_ID_FOR_SRP'],
            'PASSWORD_CLAIM_SECRET_BLOCK': challenge_parameters['SECRET_BLOCK'],  # noqa
            'PASSWORD_CLAIM_SIGNATURE': sig_str}
        if self.client_secret is not None:
            challenge_responses['SECRET_HASH'] = get_secret_hash(
                self.username, self.client_id, self.client_secret)
        return challenge_responses
