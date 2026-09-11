using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
public static class SpecimenDesktop {
  [StructLayout(LayoutKind.Sequential)] public struct Rect {public int Left,Top,Right,Bottom;}
  [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] public struct DevMode {
    [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string device;
    public short spec,driver,size,extra; public int fields,x,y,orientation,fixedOutput;
    public short color,duplex,yResolution,ttOption,collate;
    [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string form;
    public short logPixels; public int bits,width,height,flags,frequency,icmMethod,icmIntent,media,dither,reserved1,reserved2,panningWidth,panningHeight;
  }
  [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr value);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern bool EnumDisplaySettings(string name,int mode,ref DevMode value);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int ChangeDisplaySettings(ref DevMode value,int flags);
  [DllImport("user32.dll")] static extern int GetSystemMetrics(int index);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern IntPtr FindWindow(string cls,string title);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h,out Rect rect);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetDpiForWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool MoveWindow(IntPtr h,int x,int y,int width,int height,bool repaint);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,out uint id);
  delegate bool EnumCallback(IntPtr h,IntPtr data);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumCallback cb,IntPtr data);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern bool SystemParametersInfo(int action,int param,string value,int flags);
  [DllImport("user32.dll")] static extern bool SetSysColors(int count,int[] elements,int[] colors);
  [DllImport("user32.dll")] static extern IntPtr OpenInputDesktop(int flags,bool inherit,int access);
  [DllImport("user32.dll")] static extern bool CloseDesktop(IntPtr desktop);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  static IntPtr Browser(int pid){IntPtr result=IntPtr.Zero;EnumWindows(delegate(IntPtr h,IntPtr _){uint id;GetWindowThreadProcessId(h,out id);if(id==pid&&IsWindowVisible(h)){result=h;return false;}return true;},IntPtr.Zero);if(result==IntPtr.Zero)throw new Exception("Owned Chrome window is unavailable");return result;}
  public static void Initialize(){
    SetProcessDpiAwarenessContext(new IntPtr(-4));
    var dm=new DevMode();dm.size=(short)Marshal.SizeOf(typeof(DevMode));
    if(!EnumDisplaySettings(null,-1,ref dm))throw new Exception("Cannot inspect guest display");
    dm.width=1600;dm.height=900;dm.fields=0x80000|0x100000;
    if(ChangeDisplaySettings(ref dm,0)!=0)throw new Exception("Guest display cannot select 1600 x 900; configure the Sandbox display before capture");
    SystemParametersInfo(20,0,"",3);SetSysColors(1,new int[]{1},new int[]{0x00363024});
  }
  public static Rect Bounds(int pid){Rect r;GetWindowRect(Browser(pid),out r);return r;}
  public static Rect Taskbar(){var h=FindWindow("Shell_TrayWnd",null);Rect r;if(h==IntPtr.Zero||!IsWindowVisible(h)||!GetWindowRect(h,out r))throw new Exception("Real Windows Explorer taskbar is unavailable");return r;}
  public static void Arrange(int pid){var h=Browser(pid);MoveWindow(h,144,18,1312,823,true);SetForegroundWindow(h);}
  public static string Capture(int pid){
    var h=Browser(pid);var bar=Taskbar();var r=Bounds(pid);
    var input=OpenInputDesktop(0,false,0x0100);if(input==IntPtr.Zero)throw new Exception("Interactive desktop is locked or disconnected");CloseDesktop(input);
    if(GetForegroundWindow()!=h)throw new Exception("Owned Chrome lost foreground focus; operator recovery required");
    if(GetSystemMetrics(0)!=1600||GetSystemMetrics(1)!=900||GetSystemMetrics(80)!=1)throw new Exception("Guest display geometry changed; expected one 1600 x 900 display");
    if(GetDpiForWindow(h)!=96)throw new Exception("Guest scaling must be 100% (96 DPI)");
    if(bar.Bottom!=900||bar.Top<841||bar.Top>875||r.Bottom>bar.Top||r.Left<0||r.Right>1600)throw new Exception("Browser or native taskbar geometry changed");
    using(var bitmap=new Bitmap(1600,900,PixelFormat.Format32bppArgb))using(var graphics=Graphics.FromImage(bitmap))using(var stream=new MemoryStream()){
      // This method is callable only from the guarded Sandbox worker. GDI does
      // not add a hardware cursor: the existing recorded cyan page cursor is one.
      graphics.CopyFromScreen(0,0,0,0,new Size(1600,900),CopyPixelOperation.SourceCopy);
      bitmap.Save(stream,ImageFormat.Png);return Convert.ToBase64String(stream.ToArray());
    }
  }
}
