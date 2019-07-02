//
//  PermissonIosFaceId.swift
//  pillarwallet
//
//  Created by Developer Developer on 7/1/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import LocalAuthentication

@objc(PermissionIosFaceId)

class PermissionIosFaceId: NSObject {
  let authContext = LAContext()

  @objc
  func request() {
    authContext.evaluatePolicy(LAPolicy.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Message permission") {success, error in };
    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
      self.authContext.invalidate();
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

