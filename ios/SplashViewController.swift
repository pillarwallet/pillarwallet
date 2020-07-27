import UIKit
import SwiftyGif

class SplashViewController: UIViewController {

  @IBOutlet weak var logoImageView: UIImageView!
  
  override func viewDidLoad() {
    
    do {
        let gif = try UIImage(gifName: "animated_logo.gif")
        logoImageView.setGifImage(gif, loopCount: -1)
    } catch {
        print(error)
    }
  }
}
