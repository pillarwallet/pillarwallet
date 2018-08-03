LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)
LOCAL_MODULE := libscrypt
LOCAL_LIBSCRYPT_SRC := $(LOCAL_PATH)/../../../../libscrypt
LOCAL_C_INCLUDES := $(LOCAL_LIBSCRYPT_SRC)/

LOCAL_SRC_FILES := \
$(LOCAL_LIBSCRYPT_SRC)/b64.c \
$(LOCAL_LIBSCRYPT_SRC)/crypto_scrypt-hexconvert.c \
$(LOCAL_LIBSCRYPT_SRC)/sha256.c \
$(LOCAL_LIBSCRYPT_SRC)/crypto-mcf.c \
$(LOCAL_LIBSCRYPT_SRC)/crypto_scrypt-nosse.c \
$(LOCAL_LIBSCRYPT_SRC)/slowequals.c \
$(LOCAL_LIBSCRYPT_SRC)/crypto_scrypt-check.c \
$(LOCAL_LIBSCRYPT_SRC)/crypto-scrypt-saltgen.c \
$(LOCAL_LIBSCRYPT_SRC)/crypto_scrypt-hash.c \
$(LOCAL_LIBSCRYPT_SRC)/main.c

include $(BUILD_STATIC_LIBRARY)

include $(CLEAR_VARS)
LOCAL_MODULE := libscrypt_jni
LOCAL_STATIC_LIBRARIES := libscrypt

LOCAL_LIBSCRYPT_SRC := $(LOCAL_PATH)/../../../../libscrypt
LOCAL_C_INCLUDES := $(LOCAL_LIBSCRYPT_SRC)

LOCAL_SRC_FILES := $(LOCAL_PATH)/libscrypt-jni.c

LOCAL_LDLIBS := -llog

include $(BUILD_SHARED_LIBRARY)